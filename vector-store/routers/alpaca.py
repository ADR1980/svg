from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.alpaca_service import (
    is_alpaca_configured,
    check_connection,
    get_account,
    get_positions,
    get_portfolio_summary,
    place_order,
    get_orders,
    get_quotes,
)

router = APIRouter(prefix="/api/v1/alpaca", tags=["Alpaca Markets"])


def _require_alpaca():
    if not is_alpaca_configured():
        raise HTTPException(status_code=503, detail="Alpaca API nicht konfiguriert.")


# ---------------------------------------------------------------------------
# Verbindung & Konto
# ---------------------------------------------------------------------------

@router.get("/status")
def alpaca_status():
    """Prüft ob die Alpaca API konfiguriert ist."""
    return {"configured": is_alpaca_configured()}


@router.get("/connection")
def alpaca_connection():
    """Prüft die Verbindung zur Alpaca Markets API."""
    return check_connection()


@router.get("/account")
def alpaca_account():
    """Gibt Kontoinformationen zurück (Cash, Kaufkraft, Portfolio-Wert)."""
    _require_alpaca()
    return get_account()


# ---------------------------------------------------------------------------
# Portfolio
# ---------------------------------------------------------------------------

@router.get("/portfolio")
def alpaca_portfolio():
    """Portfolio-Übersicht: Konto + alle Positionen + Gewinn/Verlust."""
    _require_alpaca()
    return get_portfolio_summary()


@router.get("/positions")
def alpaca_positions():
    """Alle offenen Positionen."""
    _require_alpaca()
    return get_positions()


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class OrderRequest(BaseModel):
    symbol: str
    qty: int = 1
    side: str = "buy"


@router.post("/orders")
def alpaca_place_order(order: OrderRequest):
    """Platziert eine Market-Order (buy/sell)."""
    _require_alpaca()
    if order.side not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="side muss 'buy' oder 'sell' sein.")
    if order.qty < 1:
        raise HTTPException(status_code=400, detail="qty muss mindestens 1 sein.")
    try:
        return place_order(order.symbol, order.qty, order.side)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order fehlgeschlagen: {e}")


@router.get("/orders")
def alpaca_orders(
    status: str = Query("all", pattern="^(all|open|closed)$"),
    limit: int = Query(20, ge=1, le=100),
):
    """Gibt Orders zurück (all, open, closed)."""
    _require_alpaca()
    return get_orders(status=status, limit=limit)


# ---------------------------------------------------------------------------
# Marktdaten
# ---------------------------------------------------------------------------

@router.get("/quotes")
def alpaca_quotes(symbols: str = Query(..., description="Kommagetrennte Symbole, z.B. MSFT,AAPL,NVDA")):
    """Aktuelle Kurse für eine Liste von Aktien-Symbolen."""
    _require_alpaca()
    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    if not sym_list:
        raise HTTPException(status_code=400, detail="Mindestens ein Symbol angeben.")
    return get_quotes(sym_list)
