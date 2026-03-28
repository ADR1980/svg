from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from middleware.auth import get_tenant
from models.tenant import TenantContext
from services import doctype_service

router = APIRouter(prefix="/api/v1/doc-types", tags=["Dokumenttypen"])


class DocTypeCreate(BaseModel):
    id: str
    label: str
    color: str = "#6b7280"
    icon: str = ""


class DocTypeUpdate(BaseModel):
    label: str | None = None
    color: str | None = None
    icon: str | None = None


@router.get("")
def list_doc_types(tenant: TenantContext = Depends(get_tenant)):
    """Gibt alle Dokumenttypen des Tenants zurück."""
    return doctype_service.get_doc_types(tenant.tenant_id)


@router.post("", status_code=201)
def create_doc_type(data: DocTypeCreate, tenant: TenantContext = Depends(get_tenant)):
    """Erstellt einen neuen Dokumenttyp."""
    try:
        return doctype_service.create_doc_type(
            tenant.tenant_id, data.id, data.label, data.color, data.icon,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{type_id}")
def update_doc_type(type_id: str, data: DocTypeUpdate, tenant: TenantContext = Depends(get_tenant)):
    """Aktualisiert einen Dokumenttyp (Label, Farbe, Icon)."""
    try:
        return doctype_service.update_doc_type(
            tenant.tenant_id, type_id, data.label, data.color, data.icon,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{type_id}", status_code=204)
def delete_doc_type(type_id: str, tenant: TenantContext = Depends(get_tenant)):
    """Löscht einen Dokumenttyp (nur nicht-System-Typen, nur wenn keine Dokumente zugeordnet)."""
    try:
        deleted = doctype_service.delete_doc_type(tenant.tenant_id, type_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Dokumenttyp '{type_id}' nicht gefunden")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
