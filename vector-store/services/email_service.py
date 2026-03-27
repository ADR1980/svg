"""Email-Ingestion Service.

Verbindet sich mit einer IMAP-Mailbox, holt ungelesene E-Mails ab,
verarbeitet Body und Anhänge und speichert sie als Dokumente.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime

from imapclient import IMAPClient

from config import (
    IMAP_HOST,
    IMAP_PORT,
    IMAP_EMAIL,
    IMAP_PASSWORD,
    IMAP_MAILBOX,
    IMAP_USE_SSL,
    EMAIL_DEFAULT_LANGUAGE,
)
from services.email_parser_service import parse_email_message
from services.email_processor import process_parsed_email

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
    """Verarbeitet eine einzelne IMAP-E-Mail via shared Processor."""
    parsed = parse_email_message(msg_data[b"RFC822"])
    return process_parsed_email(
        parsed,
        source_label=f"imap:{IMAP_EMAIL}",
        create_document_fn=create_document_fn,
        get_document_fn=get_document_fn,
    )
