from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from middleware.auth import get_tenant
from models.document import DocumentResponse, DocumentLinkCreate, DocumentLinkResponse
from models.tenant import TenantContext
from services import document_service, notes_service

router = APIRouter(prefix="/api/v1/entities", tags=["Entitäten"])


# ─── Pydantic Models ────────────────────────────────────────────────────────

class EntityMetadataUpdate(BaseModel):
    metadata: dict[str, Any]


class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


class LinkCreate(BaseModel):
    target_rid: str
    link_type: str = "relates-to"
    metadata: dict[str, Any] = {}


# ─── Listen ──────────────────────────────────────────────────────────────────

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


# ─── Entity Detail ───────────────────────────────────────────────────────────

@router.get("/{rid:path}/detail")
def get_entity_detail(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt die vollständige Entity-Detailansicht zurück: Dokument, Notizen, Beziehungen, Erwähnungen."""
    entity = document_service.get_document(rid, tenant=tenant)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entität nicht gefunden: {rid}")

    # Alle Links (ein- und ausgehend)
    links = document_service.get_links(rid, tenant=tenant)

    # Kategorisierte Beziehungen
    mentions = []      # Dokumente die diese Entität erwähnen
    intelligence = []  # OSINT-Berichte
    related = []       # Sonstige Beziehungen
    for l in links:
        other_rid = l.target_rid if l.source_rid == rid else l.source_rid
        link_info = {"rid": other_rid, "link_type": l.link_type, "metadata": l.metadata, "created_at": str(l.created_at)}

        # Titel des verlinkten Dokuments holen
        other_doc = document_service.get_document(other_rid, tenant=tenant)
        if other_doc:
            link_info["title"] = other_doc.title
            link_info["doc_type"] = other_doc.doc_type

        if l.link_type == "mentions":
            mentions.append(link_info)
        elif l.link_type == "has-intelligence":
            intelligence.append(link_info)
        else:
            related.append(link_info)

    # Notizen
    notes = notes_service.get_notes(rid, tenant.visible_tenant_ids)

    return {
        "entity": entity,
        "mentions": mentions,
        "intelligence": intelligence,
        "related": related,
        "notes": notes,
    }


@router.get("/{rid:path}", response_model=DocumentResponse)
def get_entity(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Ruft eine Entität per RID ab."""
    entity = document_service.get_document(rid, tenant=tenant)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entität nicht gefunden: {rid}")
    return entity


# ─── Metadaten bearbeiten ────────────────────────────────────────────────────

@router.put("/{rid:path}/metadata")
def update_entity_metadata(rid: str, data: EntityMetadataUpdate, tenant: TenantContext = Depends(get_tenant)):
    """Aktualisiert die Metadaten einer Entität (z.B. Branche, Standort, Rolle)."""
    from supabase import create_client
    from config import SUPABASE_URL, SUPABASE_ANON_KEY

    entity = document_service.get_document(rid, tenant=tenant)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entität nicht gefunden: {rid}")

    # Bestehende Metadaten mit neuen mergen (nicht ersetzen)
    merged = {**entity.metadata, **data.metadata}

    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.table("documents").update({"metadata": merged}).eq("rid", rid).eq("tenant_id", tenant.tenant_id).execute()

    return {"rid": rid, "metadata": merged}


# ─── Notizen ─────────────────────────────────────────────────────────────────

@router.get("/{rid:path}/notes")
def get_notes(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt alle Notizen einer Entität zurück."""
    return notes_service.get_notes(rid, tenant.visible_tenant_ids)


@router.post("/{rid:path}/notes", status_code=201)
def create_note(rid: str, data: NoteCreate, tenant: TenantContext = Depends(get_tenant)):
    """Erstellt eine neue Notiz zu einer Entität."""
    try:
        return notes_service.create_note(rid, tenant.tenant_id, data.content, author=tenant.user_email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{rid:path}/notes/{note_id}")
def update_note(rid: str, note_id: int, data: NoteUpdate, tenant: TenantContext = Depends(get_tenant)):
    """Aktualisiert eine Notiz."""
    try:
        return notes_service.update_note(note_id, tenant.tenant_id, data.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{rid:path}/notes/{note_id}", status_code=204)
def delete_note(rid: str, note_id: int, tenant: TenantContext = Depends(get_tenant)):
    """Löscht eine Notiz."""
    if not notes_service.delete_note(note_id, tenant.tenant_id):
        raise HTTPException(status_code=404, detail="Notiz nicht gefunden")


# ─── Beziehungen ─────────────────────────────────────────────────────────────

@router.get("/{rid:path}/mentions", response_model=list[DocumentLinkResponse])
def get_entity_mentions(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt alle Dokumente zurück, die diese Entität erwähnen."""
    links = document_service.get_links(rid, tenant=tenant)
    return [l for l in links if l.link_type == "mentions"]


@router.post("/{rid:path}/links", status_code=201)
def create_entity_link(rid: str, data: LinkCreate, tenant: TenantContext = Depends(get_tenant)):
    """Erstellt eine manuelle Beziehung zwischen zwei Entitäten."""
    link = DocumentLinkCreate(target_rid=data.target_rid, link_type=data.link_type, metadata=data.metadata)
    try:
        return document_service.create_link(rid, link, tenant=tenant)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
