from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import get_tenant, require_admin
from models.tenant import (
    TenantContext,
    TenantCreate,
    TenantResponse,
    TenantWithApiKey,
    UserCreate,
    UserResponse,
)
from services import tenant_service

router = APIRouter(prefix="/api/v1/tenants", tags=["Tenant-Management"])


@router.get("", response_model=list[TenantResponse])
def list_tenants(tenant: TenantContext = Depends(get_tenant)):
    """Listet alle für den aktuellen Tenant sichtbaren Tenants."""
    return tenant_service.list_tenants(tenant.visible_tenant_ids)


@router.post("", response_model=TenantResponse, status_code=201)
def create_tenant(data: TenantCreate, tenant: TenantContext = Depends(require_admin)):
    """Erstellt einen neuen Child-Tenant (nur Admin)."""
    # Child-Tenant wird automatisch dem aktuellen Tenant zugeordnet
    if not data.parent_tenant_id:
        data.parent_tenant_id = tenant.tenant_id
    # Nur eigene Children erlaubt
    if data.parent_tenant_id not in tenant.visible_tenant_ids:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Parent-Tenant")
    try:
        return tenant_service.create_tenant(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{tenant_id}/api-key", response_model=TenantWithApiKey)
def generate_api_key(tenant_id: str, tenant: TenantContext = Depends(require_admin)):
    """Generiert einen neuen API-Key für einen Tenant (nur Admin)."""
    if tenant_id not in tenant.visible_tenant_ids:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Tenant")
    api_key = tenant_service.generate_and_store_api_key(tenant_id)
    return TenantWithApiKey(tenant_id=tenant_id, api_key=api_key)


@router.get("/{tenant_id}/users", response_model=list[UserResponse])
def list_users(tenant_id: str, tenant: TenantContext = Depends(require_admin)):
    """Listet alle Users eines Tenants (nur Admin)."""
    if tenant_id not in tenant.visible_tenant_ids:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Tenant")
    return tenant_service.list_users(tenant_id)


@router.post("/{tenant_id}/users", response_model=UserResponse, status_code=201)
def create_user(tenant_id: str, data: UserCreate, tenant: TenantContext = Depends(require_admin)):
    """Erstellt einen neuen User für einen Tenant (nur Admin)."""
    if tenant_id not in tenant.visible_tenant_ids:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Tenant")
    try:
        return tenant_service.create_user(tenant_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
