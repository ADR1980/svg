from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response

from middleware.auth import get_tenant
from models.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentLinkCreate,
    DocumentLinkResponse,
)
from models.exceptions import SpamRejectedError, DuplicateDocumentError
from models.tenant import TenantContext
from services import document_service
from services.email_parser_service import extract_attachment_text
from services.file_storage_service import save_file, get_file, get_file_info

router = APIRouter(prefix="/api/v1/documents", tags=["Dokumente"])


@router.post("", response_model=DocumentResponse, status_code=201)
def create_document(doc: DocumentCreate, tenant: TenantContext = Depends(get_tenant)):
    """Erstellt ein neues Dokument (tenant-scoped)."""
    try:
        return document_service.create_document(doc, tenant=tenant)
    except SpamRejectedError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": "spam", "reason": e.reason, "score": e.score},
        )
    except DuplicateDocumentError as e:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "duplicate",
                "type": e.dup_type,
                "existing_rid": e.existing_rid,
                "similarity": e.similarity,
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    tenant: TenantContext = Depends(get_tenant),
    type: str | None = Query(None, description="Dokumenttyp filtern"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listet alle Dokumente des Tenants."""
    return document_service.list_documents(tenant=tenant, doc_type=type, limit=limit, offset=offset)


@router.get("/{rid:path}", response_model=DocumentResponse)
def get_document(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Ruft ein Dokument per RID ab (tenant-scoped)."""
    doc = document_service.get_document(rid, tenant=tenant)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Dokument nicht gefunden: {rid}")
    return doc


@router.delete("/{rid:path}", status_code=204)
def delete_document(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Löscht ein Dokument (nur eigener Tenant)."""
    deleted = document_service.delete_document(rid, tenant=tenant)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Dokument nicht gefunden: {rid}")


# ─── Datei-Upload ────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".txt", ".md", ".csv"}


@router.post("/upload", response_model=DocumentResponse, status_code=201)
def upload_file(
    tenant: TenantContext = Depends(get_tenant),
    file: UploadFile = File(...),
    doc_type: str = Form("intelligence"),
    title: str = Form(None),
    language: str = Form("de"),
    source: str = Form(None),
):
    """Lädt eine Datei hoch (PDF, DOCX, XLSX, TXT, MD, CSV) und erstellt ein Dokument."""
    filename = file.filename or "upload"
    ext = ("." + filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Dateityp '{ext}' nicht unterstützt. Erlaubt: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    payload = file.file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Datei ist leer")

    # Text extrahieren
    content = extract_attachment_text(filename, payload)
    if not content or content.startswith("(Textextraktion fehlgeschlagen"):
        raise HTTPException(status_code=422, detail=f"Text konnte nicht aus '{filename}' extrahiert werden")

    doc_title = title or filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ")

    doc = DocumentCreate(
        doc_type=doc_type,
        title=doc_title,
        content=content,
        language=language,
        source=source or f"upload:{filename}",
    )

    try:
        result = document_service.create_document(doc, tenant=tenant)
        # Original-Datei speichern
        save_file(result.rid, tenant.tenant_id, filename, payload)
        return result
    except SpamRejectedError as e:
        raise HTTPException(status_code=422, detail={"error": "spam", "reason": e.reason, "score": e.score})
    except DuplicateDocumentError as e:
        raise HTTPException(
            status_code=409,
            detail={"error": "duplicate", "type": e.dup_type, "existing_rid": e.existing_rid, "similarity": e.similarity},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Datei-Download ─────────────────────────────────────────────────────────


@router.get("/{rid:path}/file")
def download_file(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Lädt die Original-Datei eines Dokuments herunter."""
    file_data = get_file(rid, tenant.visible_tenant_ids)
    if not file_data:
        raise HTTPException(status_code=404, detail="Keine Original-Datei vorhanden")

    return Response(
        content=file_data["data"],
        media_type=file_data["content_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{file_data["filename"]}"',
            "Content-Length": str(file_data["file_size"]),
        },
    )


@router.get("/{rid:path}/file/info")
def file_info(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt Metadaten der Original-Datei zurück (ohne Inhalt)."""
    info = get_file_info(rid, tenant.visible_tenant_ids)
    if not info:
        return {"has_file": False}
    return {"has_file": True, **info}


@router.get("/{rid:path}/file/preview")
def file_preview(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt die Original-Datei inline zurück (für PDF-Vorschau im Browser)."""
    file_data = get_file(rid, tenant.visible_tenant_ids)
    if not file_data:
        raise HTTPException(status_code=404, detail="Keine Original-Datei vorhanden")

    return Response(
        content=file_data["data"],
        media_type=file_data["content_type"],
        headers={
            "Content-Disposition": f'inline; filename="{file_data["filename"]}"',
        },
    )


# ─── Dokument-Links ──────────────────────────────────────────────────────────


@router.post("/{rid:path}/links", response_model=DocumentLinkResponse, status_code=201)
def create_link(rid: str, link: DocumentLinkCreate, tenant: TenantContext = Depends(get_tenant)):
    """Erstellt eine Verknüpfung zu einem anderen Dokument."""
    try:
        return document_service.create_link(rid, link, tenant=tenant)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{rid:path}/links", response_model=list[DocumentLinkResponse])
def get_links(rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt alle Verknüpfungen eines Dokuments zurück."""
    return document_service.get_links(rid, tenant=tenant)
