"""Entity-Notizen Service.

CRUD-Operationen für Notizen zu Personen und Unternehmen.
"""

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_notes(entity_rid: str, tenant_ids: list[str]) -> list[dict]:
    """Gibt alle Notizen einer Entität zurück."""
    client = _get_client()
    result = (
        client.table("entity_notes")
        .select("id, entity_rid, content, author, created_at, updated_at")
        .eq("entity_rid", entity_rid)
        .in_("tenant_id", tenant_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def create_note(entity_rid: str, tenant_id: str, content: str, author: str | None = None) -> dict:
    """Erstellt eine neue Notiz."""
    if not content.strip():
        raise ValueError("Notiz darf nicht leer sein")

    client = _get_client()
    result = client.table("entity_notes").insert({
        "entity_rid": entity_rid,
        "tenant_id": tenant_id,
        "content": content.strip(),
        "author": author,
    }).execute()
    return result.data[0]


def update_note(note_id: int, tenant_id: str, content: str) -> dict:
    """Aktualisiert eine Notiz."""
    if not content.strip():
        raise ValueError("Notiz darf nicht leer sein")

    client = _get_client()
    result = (
        client.table("entity_notes")
        .update({"content": content.strip()})
        .eq("id", note_id)
        .eq("tenant_id", tenant_id)
        .execute()
    )
    if not result.data:
        raise ValueError(f"Notiz #{note_id} nicht gefunden")
    return result.data[0]


def delete_note(note_id: int, tenant_id: str) -> bool:
    """Löscht eine Notiz."""
    client = _get_client()
    result = (
        client.table("entity_notes")
        .delete()
        .eq("id", note_id)
        .eq("tenant_id", tenant_id)
        .execute()
    )
    return len(result.data) > 0
