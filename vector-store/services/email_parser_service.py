"""Email-Parser Service.

Parst RFC822 E-Mail-Nachrichten und extrahiert:
- Body (Plain-Text bevorzugt, HTML-Fallback)
- Anhänge (.pdf, .docx, .txt, .md) mit Textextraktion
"""

import email
import io
import logging
from dataclasses import dataclass, field
from email import policy
from email.message import EmailMessage

logger = logging.getLogger(__name__)


@dataclass
class ParsedAttachment:
    """Ein geparster E-Mail-Anhang."""
    filename: str
    content_type: str
    size: int
    extracted_text: str | None = None


@dataclass
class ParsedEmail:
    """Eine vollständig geparste E-Mail."""
    message_id: str | None
    sender: str
    recipients: list[str]
    cc: list[str]
    subject: str
    date: str | None
    body_text: str
    attachments: list[ParsedAttachment] = field(default_factory=list)


# Unterstützte Anhang-Typen für Textextraktion
SUPPORTED_ATTACHMENT_TYPES = {
    ".pdf", ".txt", ".md", ".docx", ".csv",
}


def parse_email_message(raw_bytes: bytes) -> ParsedEmail:
    """Parst eine rohe RFC822 E-Mail-Nachricht."""
    msg = email.message_from_bytes(raw_bytes, policy=policy.default)

    message_id = msg.get("Message-ID", "").strip("<>")
    sender = msg.get("From", "")
    recipients = _parse_address_list(msg.get("To", ""))
    cc = _parse_address_list(msg.get("Cc", ""))
    subject = msg.get("Subject", "(Kein Betreff)")
    date = msg.get("Date", None)

    # Body extrahieren
    body_text = _extract_body(msg)

    # Anhänge extrahieren
    attachments = _extract_attachments(msg)

    return ParsedEmail(
        message_id=message_id or None,
        sender=sender,
        recipients=recipients,
        cc=cc,
        subject=subject,
        date=date,
        body_text=body_text,
        attachments=attachments,
    )


def _parse_address_list(header: str) -> list[str]:
    """Parst eine kommaseparierte Adressliste."""
    if not header:
        return []
    return [addr.strip() for addr in header.split(",") if addr.strip()]


def _extract_body(msg: EmailMessage) -> str:
    """Extrahiert den E-Mail-Body (Plain-Text bevorzugt)."""
    body = msg.get_body(preferencelist=("plain", "html"))
    if body is None:
        return ""

    content = body.get_content()
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    # Bei HTML: einfache Tag-Entfernung
    if body.get_content_type() == "text/html":
        content = _strip_html(content)

    return content.strip()


def _strip_html(html: str) -> str:
    """Entfernt HTML-Tags für reinen Text."""
    import re
    # Block-Elemente -> Zeilenumbruch
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"</(?:p|div|tr|li|h[1-6])>", "\n", text, flags=re.IGNORECASE)
    # Alle restlichen Tags entfernen
    text = re.sub(r"<[^>]+>", "", text)
    # HTML-Entities
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    # Mehrfache Leerzeilen reduzieren
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_attachments(msg: EmailMessage) -> list[ParsedAttachment]:
    """Extrahiert und parst alle unterstützten Anhänge."""
    attachments = []

    for part in msg.walk():
        content_disposition = part.get("Content-Disposition", "")
        if "attachment" not in content_disposition and "inline" not in content_disposition:
            continue

        filename = part.get_filename()
        if not filename:
            continue

        # Nur unterstützte Typen
        ext = _get_extension(filename)
        if ext not in SUPPORTED_ATTACHMENT_TYPES:
            continue

        payload = part.get_payload(decode=True)
        if not payload:
            continue

        extracted_text = _extract_text_from_attachment(filename, ext, payload)

        attachments.append(ParsedAttachment(
            filename=filename,
            content_type=part.get_content_type(),
            size=len(payload),
            extracted_text=extracted_text,
        ))

    return attachments


def _get_extension(filename: str) -> str:
    """Gibt die Dateiendung in Kleinbuchstaben zurück."""
    dot_pos = filename.rfind(".")
    if dot_pos == -1:
        return ""
    return filename[dot_pos:].lower()


def _extract_text_from_attachment(filename: str, ext: str, payload: bytes) -> str | None:
    """Extrahiert Text aus einem Anhang basierend auf dem Dateityp."""
    try:
        if ext in (".txt", ".md", ".csv"):
            return payload.decode("utf-8", errors="replace")

        if ext == ".pdf":
            return _extract_pdf_text(payload)

        if ext == ".docx":
            return _extract_docx_text(payload)

    except Exception as e:
        logger.warning("Textextraktion fehlgeschlagen für %s: %s", filename, e)
        return f"(Textextraktion fehlgeschlagen: {e})"

    return None


def extract_attachment_text(filename: str, payload: bytes) -> str | None:
    """Extrahiert Text aus einem Anhang (Public API).

    Prüft ob der Dateityp unterstützt wird und extrahiert den Text.
    Wird von IMAP- und Microsoft Graph-Service genutzt.
    """
    ext = _get_extension(filename)
    if ext not in SUPPORTED_ATTACHMENT_TYPES:
        return None
    return _extract_text_from_attachment(filename, ext, payload)


def _extract_pdf_text(payload: bytes) -> str:
    """Extrahiert Text aus einem PDF."""
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(payload))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def _extract_docx_text(payload: bytes) -> str:
    """Extrahiert Text aus einem DOCX."""
    from docx import Document

    doc = Document(io.BytesIO(payload))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)
