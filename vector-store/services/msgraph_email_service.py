"""Microsoft Graph Email-Ingestion Service.

Holt E-Mails via Microsoft Graph API (OAuth2 Client-Credentials-Flow)
und verarbeitet sie über den shared Email-Processor zu Dokumenten.

Voraussetzung: Azure AD App-Registration mit Application Permission "Mail.ReadWrite".
"""

import base64
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

import httpx

from config import (
    MSGRAPH_TENANT_ID,
    MSGRAPH_CLIENT_ID,
    MSGRAPH_CLIENT_SECRET,
    MSGRAPH_MAILBOX,
)
from services.email_parser_service import ParsedEmail, ParsedAttachment, extract_attachment_text
from services.email_processor import process_parsed_email

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
TOKEN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"

MAX_MESSAGES_PER_POLL = 50


# ─── Token Management ────────────────────────────────────────────────────────


class _TokenCache:
    """Cached OAuth2 Access-Token mit automatischem Refresh."""

    def __init__(self):
        self._token: str | None = None
        self._expires_at: datetime | None = None

    def get_token(self) -> str:
        if self._token and self._expires_at and datetime.now() < self._expires_at:
            return self._token
        return self._refresh()

    def _refresh(self) -> str:
        url = TOKEN_URL.format(tenant_id=MSGRAPH_TENANT_ID)
        resp = httpx.post(url, data={
            "client_id": MSGRAPH_CLIENT_ID,
            "client_secret": MSGRAPH_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        })
        resp.raise_for_status()
        data = resp.json()
        self._token = data["access_token"]
        self._expires_at = datetime.now() + timedelta(seconds=data["expires_in"] - 60)
        logger.debug("Microsoft Graph Token erneuert (gültig bis %s)", self._expires_at)
        return self._token


_token_cache = _TokenCache()


# ─── Status ──────────────────────────────────────────────────────────────────


@dataclass
class MsgraphIngestionStatus:
    """Aktueller Status des Microsoft Graph Email-Polling."""
    enabled: bool = False
    last_poll: datetime | None = None
    last_error: str | None = None
    emails_processed_total: int = 0
    last_poll_count: int = 0


_status = MsgraphIngestionStatus()


def is_msgraph_enabled() -> bool:
    """Prüft ob Microsoft Graph Email-Ingestion konfiguriert ist."""
    return bool(MSGRAPH_TENANT_ID and MSGRAPH_CLIENT_ID and MSGRAPH_CLIENT_SECRET and MSGRAPH_MAILBOX)


def get_status() -> MsgraphIngestionStatus:
    _status.enabled = is_msgraph_enabled()
    return _status


# ─── Graph API Helpers ───────────────────────────────────────────────────────


def _graph_headers() -> dict:
    """Erzeugt Authorization-Headers für Graph API Calls."""
    return {
        "Authorization": f"Bearer {_token_cache.get_token()}",
        "Prefer": 'outlook.body-content-type="text"',
    }


def _fetch_unread_messages(client: httpx.Client) -> list[dict]:
    """Holt ungelesene Nachrichten aus der konfigurierten Mailbox."""
    url = (
        f"{GRAPH_BASE}/users/{MSGRAPH_MAILBOX}/messages"
        f"?$filter=isRead eq false"
        f"&$select=id,internetMessageId,from,toRecipients,ccRecipients,subject,receivedDateTime,body,hasAttachments"
        f"&$top={MAX_MESSAGES_PER_POLL}"
        f"&$orderby=receivedDateTime asc"
    )

    all_messages = []
    while url and len(all_messages) < 500:  # Safety-Cap
        resp = client.get(url, headers=_graph_headers())
        resp.raise_for_status()
        data = resp.json()
        all_messages.extend(data.get("value", []))
        url = data.get("@odata.nextLink")

    return all_messages


def _fetch_attachments(client: httpx.Client, message_id: str) -> list[ParsedAttachment]:
    """Lädt Anhänge einer Nachricht und extrahiert Text."""
    url = f"{GRAPH_BASE}/users/{MSGRAPH_MAILBOX}/messages/{message_id}/attachments"
    resp = client.get(url, headers=_graph_headers())
    resp.raise_for_status()

    attachments = []
    for att in resp.json().get("value", []):
        # Nur File-Attachments verarbeiten (keine Item-Attachments)
        if att.get("@odata.type") != "#microsoft.graph.fileAttachment":
            continue

        filename = att.get("name", "")
        content_bytes_b64 = att.get("contentBytes", "")
        if not filename or not content_bytes_b64:
            continue

        payload = base64.b64decode(content_bytes_b64)
        extracted_text = extract_attachment_text(filename, payload)

        attachments.append(ParsedAttachment(
            filename=filename,
            content_type=att.get("contentType", "application/octet-stream"),
            size=len(payload),
            extracted_text=extracted_text,
        ))

    return attachments


def _mark_as_read(client: httpx.Client, message_id: str) -> None:
    """Markiert eine Nachricht als gelesen."""
    url = f"{GRAPH_BASE}/users/{MSGRAPH_MAILBOX}/messages/{message_id}"
    resp = client.patch(url, headers=_graph_headers(), json={"isRead": True})
    resp.raise_for_status()


def _graph_message_to_parsed(msg: dict, attachments: list[ParsedAttachment]) -> ParsedEmail:
    """Konvertiert eine Graph API Message zu ParsedEmail."""
    sender_obj = msg.get("from", {}).get("emailAddress", {})
    return ParsedEmail(
        message_id=msg.get("internetMessageId"),
        sender=sender_obj.get("address", ""),
        recipients=[
            r["emailAddress"]["address"]
            for r in msg.get("toRecipients", [])
            if "emailAddress" in r
        ],
        cc=[
            r["emailAddress"]["address"]
            for r in msg.get("ccRecipients", [])
            if "emailAddress" in r
        ],
        subject=msg.get("subject", "(Kein Betreff)"),
        date=msg.get("receivedDateTime"),
        body_text=msg.get("body", {}).get("content", ""),
        attachments=attachments,
    )


# ─── Polling ─────────────────────────────────────────────────────────────────


def poll_and_ingest() -> list[dict]:
    """Holt ungelesene E-Mails via Microsoft Graph und erstellt Dokumente.

    Returns:
        Liste von {rid, title, status} für jede verarbeitete E-Mail.
    """
    from services.document_service import create_document, get_document

    if not is_msgraph_enabled():
        raise RuntimeError(
            "Microsoft Graph nicht konfiguriert "
            "(MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID, MSGRAPH_CLIENT_SECRET, MSGRAPH_MAILBOX fehlen)"
        )

    results = []

    try:
        with httpx.Client(timeout=30.0) as client:
            messages = _fetch_unread_messages(client)
            logger.info("Graph-Polling: %d ungelesene E-Mails gefunden", len(messages))

            for msg in messages:
                msg_id = msg.get("id", "")
                try:
                    # Anhänge laden falls vorhanden
                    attachments = []
                    if msg.get("hasAttachments"):
                        attachments = _fetch_attachments(client, msg_id)

                    # Graph-Message → ParsedEmail → Dokument
                    parsed = _graph_message_to_parsed(msg, attachments)
                    result = process_parsed_email(
                        parsed,
                        source_label=f"msgraph:{MSGRAPH_MAILBOX}",
                        create_document_fn=create_document,
                        get_document_fn=get_document,
                    )
                    results.append(result)

                    # Als gelesen markieren bei Erfolg/Spam/Duplikat
                    if result["status"] in ("created", "existing", "spam", "duplicate"):
                        _mark_as_read(client, msg_id)

                except Exception as e:
                    logger.error("Fehler bei Graph-E-Mail %s: %s", msg_id, e)
                    results.append({
                        "rid": f"unknown-graph-{msg_id[:20]}",
                        "title": msg.get("subject", f"Graph-E-Mail"),
                        "status": f"error: {e}",
                    })

        _status.last_poll = datetime.now()
        _status.last_error = None
        _status.last_poll_count = len(results)
        _status.emails_processed_total += len([r for r in results if r["status"] == "created"])

    except Exception as e:
        logger.error("Graph-Polling fehlgeschlagen: %s", e)
        _status.last_poll = datetime.now()
        _status.last_error = str(e)
        raise

    return results
