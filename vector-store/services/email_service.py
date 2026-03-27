"""Email-Ingestion Service.

Verbindet sich mit einer IMAP-Mailbox, holt ungelesene E-Mails ab,
verarbeitet Body und Anhänge und speichert sie als Dokumente.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime

from imapclient import IMAPClient
from slugify import slugify

from config import (
    IMAP_HOST,
    IMAP_PORT,
    IMAP_EMAIL,
    IMAP_PASSWORD,
    IMAP_MAILBOX,
    IMAP_USE_SSL,
    EMAIL_DEFAULT_LANGUAGE,
)
from models.document import DocumentCreate
from models.exceptions import SpamRejectedError, DuplicateDocumentError
from services.email_parser_service import parse_email_message

logger = logging.getLogger(__name__)


@dataclass
class EmailIngestionStatus:
    """Aktueller Status des Email-Polling."""
    enabled: bool = False
    last_poll: datetime | None = None
    last_error: str | None = None
    emails_processed_total: int = 0
    last_poll_count: int = 0


# Globaler Status
_status = EmailIngestionStatus()


def is_email_enabled() -> bool:
    """Prüft ob Email-Ingestion konfiguriert ist."""
    return bool(IMAP_HOST and IMAP_EMAIL and IMAP_PASSWORD)


def get_status() -> EmailIngestionStatus:
    _status.enabled = is_email_enabled()
    return _status


def poll_and_ingest() -> list[dict]:
    """Holt ungelesene E-Mails und erstellt Dokumente.

    Returns:
        Liste von {rid, title, status} für jede verarbeitete E-Mail.
    """
    from services.document_service import create_document, get_document

    if not is_email_enabled():
        raise RuntimeError("Email-Ingestion nicht konfiguriert (IMAP_HOST, IMAP_EMAIL, IMAP_PASSWORD fehlen)")

    results = []

    try:
        with IMAPClient(IMAP_HOST, port=IMAP_PORT, ssl=IMAP_USE_SSL) as client:
            client.login(IMAP_EMAIL, IMAP_PASSWORD)
            client.select_folder(IMAP_MAILBOX)

            # Ungelesene E-Mails suchen
            message_ids = client.search(["UNSEEN"])
            logger.info("Email-Polling: %d ungelesene E-Mails gefunden", len(message_ids))

            if not message_ids:
                _status.last_poll = datetime.now()
                _status.last_error = None
                _status.last_poll_count = 0
                return results

            # E-Mails abrufen
            raw_messages = client.fetch(message_ids, ["RFC822", "INTERNALDATE"])

            for msg_id, msg_data in raw_messages.items():
                try:
                    result = _process_single_email(msg_id, msg_data, create_document, get_document)
                    results.append(result)

                    # Als gelesen markieren: bei Erfolg, Duplikat ODER Spam
                    # (damit Spam-Mails nicht erneut geprüft werden)
                    if result["status"] in ("created", "existing", "spam", "duplicate"):
                        client.set_flags(msg_id, [b"\\Seen"])

                except Exception as e:
                    logger.error("Fehler bei E-Mail %s: %s", msg_id, e)
                    results.append({
                        "rid": f"unknown-{msg_id}",
                        "title": f"E-Mail #{msg_id}",
                        "status": f"error: {e}",
                    })

        _status.last_poll = datetime.now()
        _status.last_error = None
        _status.last_poll_count = len(results)
        _status.emails_processed_total += len([r for r in results if r["status"] == "created"])

    except Exception as e:
        logger.error("Email-Polling fehlgeschlagen: %s", e)
        _status.last_poll = datetime.now()
        _status.last_error = str(e)
        raise

    return results


def _process_single_email(msg_id, msg_data, create_document_fn, get_document_fn) -> dict:
    """Verarbeitet eine einzelne E-Mail und erstellt ein Dokument."""
    raw_email = msg_data[b"RFC822"]
    internal_date = msg_data.get(b"INTERNALDATE")

    # E-Mail parsen (Body + Anhänge)
    parsed = parse_email_message(raw_email)

    # RID generieren (idempotent über Message-ID)
    message_id_slug = slugify(parsed.message_id or str(msg_id), max_length=80)
    rid = f"ri.svg.email.{message_id_slug}"

    # Prüfen ob bereits verarbeitet
    existing = get_document_fn(rid)
    if existing:
        return {"rid": rid, "title": existing.title, "status": "existing"}

    # Inhalt zusammensetzen
    content_parts = []
    if parsed.body_text:
        content_parts.append(parsed.body_text)

    for att in parsed.attachments:
        if att.extracted_text:
            content_parts.append(f"\n\n--- Anhang: {att.filename} ---\n{att.extracted_text}")

    content = "\n".join(content_parts).strip()
    if not content:
        content = f"(Leere E-Mail von {parsed.sender})"

    title = parsed.subject or f"E-Mail von {parsed.sender}"

    doc = DocumentCreate(
        doc_type="email",
        title=title,
        content=content,
        metadata={
            "sender": parsed.sender,
            "recipients": parsed.recipients,
            "cc": parsed.cc,
            "email_date": parsed.date,
            "message_id": parsed.message_id,
            "attachments": [
                {"filename": a.filename, "content_type": a.content_type, "size": a.size}
                for a in parsed.attachments
            ],
            "has_attachments": len(parsed.attachments) > 0,
        },
        language=EMAIL_DEFAULT_LANGUAGE,
        source=f"email:{IMAP_EMAIL}",
        rid=rid,
    )

    try:
        result = create_document_fn(doc)
        return {"rid": result.rid, "title": result.title, "status": "created"}
    except SpamRejectedError as e:
        logger.info("E-Mail als Spam erkannt: %s (Grund: %s)", title, e.reason)
        return {"rid": rid, "title": title, "status": "spam", "reason": e.reason}
    except DuplicateDocumentError as e:
        logger.info("E-Mail-Duplikat: %s -> %s", rid, e.existing_rid)
        return {"rid": e.existing_rid, "title": title, "status": "duplicate", "type": e.dup_type}
