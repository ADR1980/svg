"""Auth-Middleware.

FastAPI Dependency die bei jedem geschützten Request den Tenant-Kontext auflöst.
Unterstützt API-Key (X-API-Key Header) und JWT (Authorization: Bearer).
"""

from fastapi import Depends, HTTPException, Request
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from models.tenant import TenantContext
from services.auth_service import decode_jwt
from services.tenant_service import resolve_api_key, get_visible_tenant_ids

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_tenant(
    request: Request,
    api_key: str | None = Depends(_api_key_header),
    bearer: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> TenantContext:
    """Löst den Tenant-Kontext aus API-Key oder JWT auf.

    Reihenfolge:
    1. X-API-Key Header → API-Key Resolution
    2. Authorization: Bearer <jwt> → JWT Decode
    3. Kein Auth → 401

    Raises:
        HTTPException 401: Kein oder ungültiger Auth-Header.
        HTTPException 403: Token abgelaufen oder ungültig.
    """

    # 1. API-Key prüfen
    if api_key:
        tenant = resolve_api_key(api_key)
        if not tenant:
            raise HTTPException(status_code=401, detail="Ungültiger API-Key")
        return tenant

    # 2. JWT prüfen
    if bearer:
        try:
            payload = decode_jwt(bearer.credentials)
        except Exception:
            raise HTTPException(status_code=403, detail="Token ungültig oder abgelaufen")

        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(status_code=403, detail="Token enthält keine Tenant-Information")

        visible = get_visible_tenant_ids(tenant_id)

        return TenantContext(
            tenant_id=tenant_id,
            tenant_name=payload.get("tenant_name", tenant_id),
            visible_tenant_ids=visible,
            role=payload.get("role", "member"),
            auth_method="jwt",
            user_id=int(payload.get("sub", 0)),
            user_email=payload.get("email"),
        )

    # 3. Kein Auth
    raise HTTPException(
        status_code=401,
        detail="Authentifizierung erforderlich. X-API-Key Header oder Authorization: Bearer <jwt> senden.",
    )


def require_admin(tenant: TenantContext = Depends(get_tenant)) -> TenantContext:
    """Erfordert Admin-Rolle."""
    if tenant.role != "admin":
        raise HTTPException(status_code=403, detail="Admin-Berechtigung erforderlich")
    return tenant
