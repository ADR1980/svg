from fastapi import APIRouter, Depends

from middleware.auth import get_tenant
from models.document import SearchQuery, SearchResult
from models.tenant import TenantContext
from services.document_service import search_documents

router = APIRouter(prefix="/api/v1/search", tags=["Suche"])


@router.post("", response_model=list[SearchResult])
def search(query: SearchQuery, tenant: TenantContext = Depends(get_tenant)):
    """Tenant-scoped semantische Suche über Dokumente."""
    return search_documents(query, tenant=tenant)
