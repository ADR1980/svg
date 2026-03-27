"""Shared Email Processor.

Provider-agnostische Logik zur Verarbeitung geparster E-Mails in Dokumente.
Wird von IMAP-Service und Microsoft Graph-Service gleichermaßen genutzt.
"""

import logging

from slugify import slugify

from config import EMAIL_DEFAULT_LANGUAGE
from models.document import DocumentCreate
from models.exceptions import SpamRejectedError, DuplicateDocumentError
from services.email_parser_service import ParsedEmail

logger = logging.getLogger(__name__)


def process_parsed_email(
    parsed: ParsedEmail,
    source_label: str,
    create_document_fn,
    get_document_fn,
    tenant_id: str | None = None,
) -> dict:
    """Verarbeitet eine geparste E-Mail und erstellt ein Dokument.

    Provider-agnostisch: Akzeptiert ein ParsedEmail-Objekt egal ob es
    von IMAP, Microsoft Graph oder einem anderen Backend stammt.

    Args:
        parsed: Geparste E-Mail (Body + Anhänge)
        source_label: Quell-Kennzeichnung, z.B. "imap:docs@svg.global" oder "msgraph:shared@company.com"
        create_document_fn: Funktion zum Erstellen von Dokumenten
        get_document_fn: Funktion zum Abrufen von Dokumenten (für Duplikat-Check)

    Returns:
        Dict mit {rid, title, status} und optional weiteren Feldern.
    """
    # RID generieren (idempotent über Message-ID, mit Tenant-Namespace)
    namespace = tenant_id or "svg"
    message_id_slug = slugify(parsed.message_id or f"{parsed.sender}-{parsed.subject}", max_length=80)
    rid = f"ri.{namespace}.email.{message_id_slug}"

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
            "source_provider": source_label.split(":")[0] if ":" in source_label else source_label,
        },
        language=EMAIL_DEFAULT_LANGUAGE,
        source=f"email:{source_label}",
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
