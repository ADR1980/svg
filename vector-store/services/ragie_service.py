"""Ragie.ai API-Verbindung: Dokument-Management und semantische Suche."""

import logging

import httpx

from config import RAGIE_API_KEY

logger = logging.getLogger(__name__)

RAGIE_BASE_URL = "https://api.ragie.ai"


def is_ragie_enabled() -> bool:
    """Prüft ob Ragie.ai konfiguriert ist (API-Key gesetzt)."""
    return bool(RAGIE_API_KEY)


def _get_headers() -> dict:
    return {
        "Authorization": f"Bearer {RAGIE_API_KEY}",
        "Accept": "application/json",
    }


def test_connection() -> dict:
    """Testet die Verbindung zur Ragie.ai API."""
    if not is_ragie_enabled():
        return {"connected": False, "error": "RAGIE_API_KEY nicht konfiguriert"}

    try:
        resp = httpx.get(
            f"{RAGIE_BASE_URL}/documents",
            headers=_get_headers(),
            params={"page_size": 1},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        doc_count = data.get("pagination", {}).get("total_count", len(data.get("documents", [])))
        logger.info("Ragie.ai Verbindung erfolgreich (%d Dokumente)", doc_count)
        return {"connected": True, "document_count": doc_count}
    except httpx.HTTPStatusError as e:
        logger.error("Ragie.ai API-Fehler: %s", e.response.status_code)
        return {"connected": False, "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error("Ragie.ai Verbindungsfehler: %s", e)
        return {"connected": False, "error": str(e)}
