"""Datei-Speicher-Service.

Speichert Original-Dateien (PDF, XLSX, DOCX) als Base64 in der
document_files Tabelle und stellt sie zum Download bereit.
"""

import base64
import logging

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY

logger = logging.getLogger(__name__)

CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".csv": "text/csv",
}


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def save_file(document_rid: str, tenant_id: str, filename: str, payload: bytes) -> bool:
    """Speichert eine Original-Datei zur Dokument-RID."""
    ext = ("." + filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""
    content_type = CONTENT_TYPES.get(ext, "application/octet-stream")

    client = _get_client()
    try:
        client.table("document_files").insert({
            "document_rid": document_rid,
            "tenant_id": tenant_id,
            "filename": filename,
            "content_type": content_type,
            "file_size": len(payload),
            "file_data": base64.b64encode(payload).decode("ascii"),
        }).execute()
        logger.info("Datei gespeichert: %s (%d bytes) -> %s", filename, len(payload), document_rid)
        return True
    except Exception as e:
        logger.warning("Datei-Speicherung fehlgeschlagen für %s: %s", document_rid, e)
        return False


def get_file(document_rid: str, tenant_ids: list[str]) -> dict | None:
    """Lädt eine Original-Datei. Gibt dict mit filename, content_type, data (bytes) zurück."""
    client = _get_client()
    result = (
        client.table("document_files")
        .select("filename, content_type, file_size, file_data")
        .eq("document_rid", document_rid)
        .in_("tenant_id", tenant_ids)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None

    row = result.data[0]
    return {
        "filename": row["filename"],
        "content_type": row["content_type"],
        "file_size": row["file_size"],
        "data": base64.b64decode(row["file_data"]),
    }


def has_file(document_rid: str) -> bool:
    """Prüft ob eine Original-Datei für dieses Dokument existiert."""
    client = _get_client()
    result = (
        client.table("document_files")
        .select("document_rid")
        .eq("document_rid", document_rid)
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def get_file_info(document_rid: str, tenant_ids: list[str]) -> dict | None:
    """Gibt Metadaten einer Datei zurück (ohne den Dateiinhalt)."""
    client = _get_client()
    result = (
        client.table("document_files")
        .select("filename, content_type, file_size")
        .eq("document_rid", document_rid)
        .in_("tenant_id", tenant_ids)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return result.data[0]
