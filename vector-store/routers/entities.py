from fastapi import APIRouter, Query

from models.document import DocumentResponse, DocumentLinkResponse
from services import document_service

router = APIRouter(prefix="/api/v1/entities", tags=["Entitäten"])


@router.get("/persons", response_model=list[DocumentResponse])
def list_persons(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listet alle erkannten Personen."""
    return document_service.list_documents(doc_type="person", limit=limit, offset=offset)


@router.get("/companies", response_model=list[DocumentResponse])
def list_companies(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listet alle erkannten Unternehmen/Organisationen."""
    return document_service.list_documents(doc_type="company", limit=limit, offset=offset)


@router.get("/{rid:path}", response_model=DocumentResponse)
def get_entity(rid: str):
    """Ruft eine Entität (Person oder Unternehmen) per RID ab."""
    from fastapi import HTTPException

    entity = document_service.get_document(rid)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entität nicht gefunden: {rid}")
    return entity


@router.get("/{rid:path}/mentions", response_model=list[DocumentLinkResponse])
def get_entity_mentions(rid: str):
    """Gibt alle Dokumente zurück, die diese Entität erwähnen."""
    links = document_service.get_links(rid)
    return [l for l in links if l.link_type == "mentions"]
