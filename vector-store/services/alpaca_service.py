"""Alpaca Markets API – Verbindungsprüfung."""

import logging
from datetime import datetime

import httpx

from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL, ALPACA_PAPER

logger = logging.getLogger(__name__)


def is_alpaca_configured() -> bool:
    """Prüft ob Alpaca API-Credentials konfiguriert sind."""
    return bool(ALPACA_API_KEY and ALPACA_SECRET_KEY)


def check_connection() -> dict:
    """Prüft die Verbindung zur Alpaca Markets API via GET /v2/account."""
    result = {
        "configured": is_alpaca_configured(),
        "connected": False,
        "paper_trading": ALPACA_PAPER,
        "account_id": None,
        "account_status": None,
        "last_check": None,
        "error": None,
    }

    if not result["configured"]:
        return result

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                f"{ALPACA_BASE_URL}/v2/account",
                headers={
                    "APCA-API-KEY-ID": ALPACA_API_KEY,
                    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json()

            result["connected"] = True
            result["account_id"] = data.get("id")
            result["account_status"] = data.get("status")
            result["last_check"] = datetime.now().isoformat()

    except httpx.HTTPStatusError as e:
        logger.warning("Alpaca API Authentifizierung fehlgeschlagen: %s", e.response.status_code)
        result["last_check"] = datetime.now().isoformat()
        result["error"] = f"HTTP {e.response.status_code}"

    except httpx.RequestError as e:
        logger.error("Alpaca API nicht erreichbar: %s", e)
        result["last_check"] = datetime.now().isoformat()
        result["error"] = str(e)

    return result
