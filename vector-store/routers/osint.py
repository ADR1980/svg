from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import get_tenant
from models.osint import OSINTRequest, OSINTReport
from models.tenant import TenantContext
from services import osint_service
from services.document_service import get_document

router = APIRouter(prefix="/api/v1/osint", tags=["OSINT"])


@router.get("/status")
def osint_status():
    """Prüft ob OSINT-Recherche verfügbar ist (Anthropic API Key konfiguriert)."""
    return {"available": osint_service.is_osint_available()}


@router.post("/investigate", response_model=OSINTReport)
def investigate(request: OSINTRequest, tenant: TenantContext = Depends(get_tenant)):
    """Startet eine OSINT-Recherche für eine Person oder ein Unternehmen."""
    if not osint_service.is_osint_available():
        raise HTTPException(status_code=503, detail="OSINT nicht verfügbar (ANTHROPIC_API_KEY fehlt)")

    # Entity auflösen
    entity_rid = request.entity_rid
    entity_name = request.entity_name
    entity_type = request.entity_type

    if entity_rid:
        doc = get_document(entity_rid, tenant)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Entität nicht gefunden: {entity_rid}")
        entity_name = entity_name or doc.title
        entity_type = entity_type or doc.doc_type
    elif not entity_name:
        raise HTTPException(status_code=400, detail="entity_rid oder entity_name erforderlich")

    if entity_type not in ("person", "company"):
        entity_type = "company"  # Default

    try:
        return osint_service.investigate_entity(
            entity_rid=entity_rid or f"unknown.{entity_name}",
            entity_name=entity_name,
            entity_type=entity_type,
            language=request.language,
            tenant=tenant,
        )
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OSINT-Recherche fehlgeschlagen: {e}")


@router.get("/report/{entity_rid:path}", response_model=OSINTReport | None)
def get_report(entity_rid: str, tenant: TenantContext = Depends(get_tenant)):
    """Gibt den neuesten OSINT-Report für eine Entität zurück."""
    report = osint_service.get_latest_report(entity_rid, tenant)
    if not report:
        raise HTTPException(status_code=404, detail="Kein OSINT-Report vorhanden")
    return report
