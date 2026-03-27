from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import get_tenant
from models.tenant import LoginRequest, TokenResponse, TenantContext, UserResponse
from services.auth_service import verify_password, create_jwt
from services.tenant_service import get_user_by_email, get_visible_tenant_ids

router = APIRouter(prefix="/api/v1/auth", tags=["Authentifizierung"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    """Login mit Email + Passwort → JWT Token."""
    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Email oder Passwort falsch")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email oder Passwort falsch")

    token, expires_in = create_jwt(
        tenant_id=user["tenant_id"],
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
    )

    return TokenResponse(
        access_token=token,
        tenant_id=user["tenant_id"],
        role=user["role"],
        expires_in=expires_in,
    )


@router.get("/me")
def get_current_user(tenant: TenantContext = Depends(get_tenant)):
    """Gibt den aktuellen Nutzer und Tenant-Kontext zurück."""
    return {
        "tenant_id": tenant.tenant_id,
        "tenant_name": tenant.tenant_name,
        "visible_tenants": tenant.visible_tenant_ids,
        "is_parent": tenant.is_parent,
        "role": tenant.role,
        "auth_method": tenant.auth_method,
        "user_id": tenant.user_id,
        "user_email": tenant.user_email,
    }
