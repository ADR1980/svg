"""Ragie.ai API-Endpunkte für Verbindungstest und Status."""

import logging

from fastapi import APIRouter, HTTPException

from services.ragie_service import is_ragie_enabled, test_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ragie", tags=["Ragie.ai"])


@router.get("/status")
def ragie_status():
    """Gibt zurück ob Ragie.ai konfiguriert ist (kein API-Call)."""
    return {"enabled": is_ragie_enabled()}


@router.get("/health")
def ragie_health():
    """Testet die Verbindung zur Ragie.ai API."""
    if not is_ragie_enabled():
        raise HTTPException(
            status_code=503,
            detail="Ragie.ai nicht verfügbar. RAGIE_API_KEY nicht konfiguriert.",
        )

    try:
        result = test_connection()
        if not result["connected"]:
            raise HTTPException(status_code=502, detail=result.get("error", "Verbindung fehlgeschlagen"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Ragie.ai Health-Check Fehler: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
