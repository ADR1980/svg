"""Dokumenttypen-Service.

Verwaltet konfigurierbare Dokumenttypen pro Tenant.
System-Typen (person, company, email, intelligence) sind geschützt.
"""

from functools import lru_cache

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY

SYSTEM_TYPES = {"person", "company", "email", "intelligence"}


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_doc_types(tenant_id: str) -> list[dict]:
    """Gibt alle Dokumenttypen eines Tenants zurück."""
    client = _get_client()
    result = (
        client.table("doc_types")
        .select("id, label, color, icon, is_system, sort_order")
        .eq("tenant_id", tenant_id)
        .order("sort_order")
        .execute()
    )
    return result.data


def get_valid_type_ids(tenant_id: str) -> set[str]:
    """Gibt die IDs aller gültigen Dokumenttypen zurück."""
    types = get_doc_types(tenant_id)
    if types:
        return {t["id"] for t in types}
    # Fallback: Standard-Typen wenn noch keine in DB
    return {
        "risk-report", "intelligence", "project", "customer", "product",
        "order", "work-step", "employee", "machine", "person", "company", "email",
    }


def validate_doc_type(doc_type: str, tenant_id: str) -> str:
    """Prüft ob ein Dokumenttyp für diesen Tenant gültig ist."""
    valid = get_valid_type_ids(tenant_id)
    if doc_type not in valid:
        raise ValueError(
            f"Ungültiger Dokumenttyp: '{doc_type}'. "
            f"Erlaubt: {', '.join(sorted(valid))}"
        )
    return doc_type


def create_doc_type(tenant_id: str, type_id: str, label: str, color: str = "#6b7280", icon: str = "") -> dict:
    """Erstellt einen neuen Dokumenttyp."""
    import re
    if not re.match(r"^[a-z][a-z0-9-]*$", type_id):
        raise ValueError("ID muss lowercase alphanumerisch sein (mit Bindestrichen)")
    if len(type_id) < 2 or len(type_id) > 30:
        raise ValueError("ID muss 2-30 Zeichen lang sein")
    if not label.strip():
        raise ValueError("Label darf nicht leer sein")

    client = _get_client()
    result = client.table("doc_types").insert({
        "id": type_id,
        "tenant_id": tenant_id,
        "label": label.strip(),
        "color": color,
        "icon": icon,
        "is_system": False,
        "sort_order": 50,
    }).execute()
    return result.data[0]


def update_doc_type(tenant_id: str, type_id: str, label: str | None = None, color: str | None = None, icon: str | None = None) -> dict:
    """Aktualisiert einen Dokumenttyp (Label, Farbe, Icon)."""
    client = _get_client()
    updates = {}
    if label is not None:
        updates["label"] = label.strip()
    if color is not None:
        updates["color"] = color
    if icon is not None:
        updates["icon"] = icon

    if not updates:
        raise ValueError("Keine Änderungen angegeben")

    result = (
        client.table("doc_types")
        .update(updates)
        .eq("id", type_id)
        .eq("tenant_id", tenant_id)
        .execute()
    )
    if not result.data:
        raise ValueError(f"Dokumenttyp '{type_id}' nicht gefunden")
    return result.data[0]


def delete_doc_type(tenant_id: str, type_id: str) -> bool:
    """Löscht einen Dokumenttyp (nur nicht-System-Typen)."""
    if type_id in SYSTEM_TYPES:
        raise ValueError(f"System-Typ '{type_id}' kann nicht gelöscht werden")

    client = _get_client()
    # Prüfe ob Dokumente mit diesem Typ existieren
    docs = (
        client.table("documents")
        .select("rid")
        .eq("tenant_id", tenant_id)
        .eq("doc_type", type_id)
        .limit(1)
        .execute()
    )
    if docs.data:
        raise ValueError(f"Typ '{type_id}' wird noch von Dokumenten verwendet und kann nicht gelöscht werden")

    result = (
        client.table("doc_types")
        .delete()
        .eq("id", type_id)
        .eq("tenant_id", tenant_id)
        .eq("is_system", False)
        .execute()
    )
    return len(result.data) > 0
