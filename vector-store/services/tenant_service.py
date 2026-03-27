"""Tenant-Management Service.

CRUD für Tenants und Users, API-Key Verwaltung.
"""

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY
from models.tenant import (
    TenantCreate,
    TenantResponse,
    TenantContext,
    UserCreate,
    UserResponse,
)
from services.auth_service import generate_api_key, hash_api_key, hash_password


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ─── Tenant CRUD ─────────────────────────────────────────────────────────────


def create_tenant(data: TenantCreate) -> TenantResponse:
    """Erstellt einen neuen Tenant."""
    client = _get_client()
    tenant_data = {
        "id": data.id,
        "name": data.name,
        "parent_tenant_id": data.parent_tenant_id,
    }
    result = client.table("tenants").insert(tenant_data).execute()
    return TenantResponse(**result.data[0])


def get_tenant(tenant_id: str) -> TenantResponse | None:
    client = _get_client()
    result = client.table("tenants").select("*").eq("id", tenant_id).execute()
    if not result.data:
        return None
    return TenantResponse(**result.data[0])


def list_tenants(visible_ids: list[str]) -> list[TenantResponse]:
    """Listet Tenants die für den aktuellen Tenant sichtbar sind."""
    client = _get_client()
    result = client.table("tenants").select("*").in_("id", visible_ids).execute()
    return [TenantResponse(**t) for t in result.data]


def get_child_tenant_ids(parent_id: str) -> list[str]:
    """Gibt alle Child-Tenant-IDs eines Parent-Tenants zurück."""
    client = _get_client()
    result = (
        client.table("tenants")
        .select("id")
        .eq("parent_tenant_id", parent_id)
        .execute()
    )
    return [row["id"] for row in result.data]


def get_visible_tenant_ids(tenant_id: str) -> list[str]:
    """Berechnet alle für einen Tenant sichtbaren Tenant-IDs (eigener + Children)."""
    children = get_child_tenant_ids(tenant_id)
    return [tenant_id] + children


# ─── API Key ─────────────────────────────────────────────────────────────────


def generate_and_store_api_key(tenant_id: str) -> str:
    """Generiert einen neuen API-Key und speichert den Hash."""
    client = _get_client()
    api_key = generate_api_key()
    key_hash = hash_api_key(api_key)

    client.table("tenants").update({"api_key_hash": key_hash}).eq("id", tenant_id).execute()

    return api_key  # Klartext nur hier, wird nicht erneut angezeigt


def resolve_api_key(api_key: str) -> TenantContext | None:
    """Löst einen API-Key zu einem TenantContext auf."""
    client = _get_client()
    key_hash = hash_api_key(api_key)

    result = client.table("tenants").select("*").eq("api_key_hash", key_hash).execute()
    if not result.data:
        return None

    tenant = result.data[0]
    visible = get_visible_tenant_ids(tenant["id"])

    return TenantContext(
        tenant_id=tenant["id"],
        tenant_name=tenant["name"],
        visible_tenant_ids=visible,
        role="admin",
        auth_method="api_key",
    )


# ─── Users ───────────────────────────────────────────────────────────────────


def create_user(tenant_id: str, data: UserCreate) -> UserResponse:
    """Erstellt einen neuen User für einen Tenant."""
    client = _get_client()
    user_data = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "tenant_id": tenant_id,
        "role": data.role,
        "name": data.name,
    }
    result = client.table("users").insert(user_data).execute()
    return UserResponse(**result.data[0])


def get_user_by_email(email: str) -> dict | None:
    """Ruft einen User inkl. password_hash ab."""
    client = _get_client()
    result = client.table("users").select("*, tenants(id, name, parent_tenant_id)").eq("email", email).execute()
    if not result.data:
        return None
    return result.data[0]


def list_users(tenant_id: str) -> list[UserResponse]:
    client = _get_client()
    result = client.table("users").select("*").eq("tenant_id", tenant_id).execute()
    return [UserResponse(**u) for u in result.data]
