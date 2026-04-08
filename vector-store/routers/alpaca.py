from fastapi import APIRouter

from services.alpaca_service import is_alpaca_configured, check_connection

router = APIRouter(prefix="/api/v1/alpaca", tags=["Alpaca Markets"])


@router.get("/status")
def alpaca_status():
    """Prüft ob die Alpaca API konfiguriert ist."""
    return {"configured": is_alpaca_configured()}


@router.get("/connection")
def alpaca_connection():
    """Prüft die Verbindung zur Alpaca Markets API."""
    return check_connection()
