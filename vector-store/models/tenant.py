from datetime import datetime
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field


@dataclass
class TenantContext:
    """Wird von der Auth-Middleware in jeden Request injiziert."""

    tenant_id: str
    tenant_name: str
    visible_tenant_ids: list[str]  # Eigener + Child-Tenant-IDs
    role: str = "member"  # 'admin', 'member', 'viewer'
    auth_method: str = "api_key"  # 'api_key' oder 'jwt'
    user_id: int | None = None  # Nur bei JWT-Auth
    user_email: str | None = None  # Nur bei JWT-Auth

    @property
    def is_parent(self) -> bool:
        return len(self.visible_tenant_ids) > 1


# ─── API Models ──────────────────────────────────────────────────────────────


class TenantCreate(BaseModel):
    """Eingabe zum Erstellen eines Tenants."""
    id: str = Field(pattern=r"^[a-z][a-z0-9-]{1,60}$")
    name: str
    parent_tenant_id: str | None = None


class TenantResponse(BaseModel):
    """Ausgabe für einen Tenant."""
    id: str
    name: str
    parent_tenant_id: str | None
    config: dict[str, Any] = {}
    created_at: datetime


class TenantWithApiKey(BaseModel):
    """Ausgabe nach API-Key-Generierung (Key wird nur einmal angezeigt)."""
    tenant_id: str
    api_key: str  # Klartext, nur einmal sichtbar


class UserCreate(BaseModel):
    """Eingabe zum Erstellen eines Users."""
    email: str
    password: str = Field(min_length=8)
    name: str | None = None
    role: str = "member"


class UserResponse(BaseModel):
    """Ausgabe für einen User."""
    id: int
    email: str
    tenant_id: str
    role: str
    name: str | None
    created_at: datetime


class LoginRequest(BaseModel):
    """Login-Eingabe."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """JWT Token-Ausgabe."""
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    role: str
    expires_in: int  # Sekunden
