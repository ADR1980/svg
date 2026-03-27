from fastapi import APIRouter, HTTPException, Query

from models.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentLinkCreate,
    DocumentLinkResponse,
)
from services import document_service

router = APIRouter(prefix="/api/v1/documents", tags=["Dokumente"])


@router.post("", response_model=DocumentResponse, status_code=201)
def create_document(doc: DocumentCreate):
    """Erstellt ein neues Dokument mit automatischer RID-Generierung, Chunking und Embedding."""
    try:
        return document_service.create_document(doc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    type: str | None = Query(None, description="Dokumenttyp filtern"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listet alle Dokumente, optional nach Typ gefiltert."""
    return document_service.list_documents(doc_type=type, limit=limit, offset=offset)


@router.get("/{rid:path}", response_model=DocumentResponse)
def get_document(rid: str):
    """Ruft ein einzelnes Dokument per RID ab."""
    doc = document_service.get_document(rid)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Dokument nicht gefunden: {rid}")
    return doc


@router.delete("/{rid:path}", status_code=204)
def delete_document(rid: str):
    """Löscht ein Dokument und alle zugehörigen Chunks."""
    deleted = document_service.delete_document(rid)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Dokument nicht gefunden: {rid}")


# ─── Dokument-Links ──────────────────────────────────────────────────────────


@router.post("/{rid:path}/links", response_model=DocumentLinkResponse, status_code=201)
def create_link(rid: str, link: DocumentLinkCreate):
    """Erstellt eine Verknüpfung zu einem anderen Dokument."""
    try:
        return document_service.create_link(rid, link)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{rid:path}/links", response_model=list[DocumentLinkResponse])
def get_links(rid: str):
    """Gibt alle Verknüpfungen eines Dokuments zurück."""
    return document_service.get_links(rid)
