from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from middleware.auth import get_tenant
from models.tenant import TenantContext
from services.file_storage_service import get_file, get_file_info

router = APIRouter(prefix="/api/v1/files", tags=["Dateien"])


@router.get("/info")
def file_info(rid: str = Query(..., description="Dokument-RID"), tenant: TenantContext = Depends(get_tenant)):
    """Gibt Metadaten der Original-Datei zurück (ohne Inhalt)."""
    info = get_file_info(rid, tenant.visible_tenant_ids)
    if not info:
        return {"has_file": False}
    return {"has_file": True, **info}


@router.get("/download")
def download_file(rid: str = Query(..., description="Dokument-RID"), tenant: TenantContext = Depends(get_tenant)):
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


@router.get("/preview")
def file_preview(rid: str = Query(..., description="Dokument-RID"), tenant: TenantContext = Depends(get_tenant)):
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
