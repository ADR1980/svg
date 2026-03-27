from fastapi import APIRouter, Depends, HTTPException, Query

from middleware.auth import get_tenant
from models.document import DocumentResponse, DocumentLinkResponse
from models.tenant import TenantContext
from services import document_service

router = APIRouter(prefix="/api/v1/entities", tags=["Entitäten"])


@router.get("/persons", response_model=list[DocumentResponse])
def list_persons(
    tenant: TenantContext = Depends(get_tenant),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listet alle erkannten Personen (tenant-scoped)."""
    return document_service.list_documents(tenant=tenant, doc_type="person", limit=limit, offset=offset)


@router.get("/companies", response_model=list[DocumentResponse])
def list_companies(
    tenant: TenantContext = Depends(get_tenant),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listet alle erkannten Unternehmen/Organisationen (tenant-scoped)."""
    return document_service.list_documents(tenant=tenant, doc_type="company", limit=limit, offset=offset)


@router.get("/{rid:path}", response_model=DocumentResponse)
def get_entity(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Ruft eine Entität per RID ab."""
    entity = document_service.get_document(rid, tenant=tenant)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entität nicht gefunden: {rid}")
    return entity


@router.get("/{rid:path}/mentions", response_model=list[DocumentLinkResponse])
def get_entity_mentions(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt alle Dokumente zurück, die diese Entität erwähnen."""
    links = document_service.get_links(rid, tenant=tenant)
    return [l for l in links if l.link_type == "mentions"]
