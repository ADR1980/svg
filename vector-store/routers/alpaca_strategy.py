from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.alpaca_service import is_alpaca_configured
from services.alpaca_strategy_service import (
    add_position,
    remove_position,
    sync_from_portfolio,
    check_and_update,
    get_strategy_status,
)

router = APIRouter(prefix="/api/v1/alpaca/strategy", tags=["Alpaca Trailing-Stop Strategie"])


def _require_alpaca():
    if not is_alpaca_configured():
        raise HTTPException(status_code=503, detail="Alpaca API nicht konfiguriert.")


# ---------------------------------------------------------------------------
# Strategie-Status
# ---------------------------------------------------------------------------

@router.get("/status")
def strategy_status():
    """Vollständiger Status aller überwachten Positionen mit Live-Kursen."""
    _require_alpaca()
    return get_strategy_status()


# ---------------------------------------------------------------------------
# Positionen verwalten
# ---------------------------------------------------------------------------

class TrackRequest(BaseModel):
    symbol: str
    qty: int = 1
    entry_price: float
    trailing_pct: float | None = None


@router.post("/track")
def track_position(req: TrackRequest):
    """Fügt eine Position zur Trailing-Stop Überwachung hinzu."""
    _require_alpaca()
    return add_position(req.symbol, req.qty, req.entry_price, req.trailing_pct)


@router.delete("/track/{symbol}")
def untrack_position(symbol: str):
    """Entfernt eine Position aus der Überwachung."""
    removed = remove_position(symbol)
    if not removed:
        raise HTTPException(status_code=404, detail=f"{symbol} nicht in Überwachung.")
    return {"removed": symbol.upper()}


@router.post("/sync")
def sync_portfolio(trailing_pct: float = Query(None, description="Trailing-Stop % (Standard: Config-Wert)")):
    """Synchronisiert alle offenen Alpaca-Positionen in die Überwachung."""
    _require_alpaca()
    added = sync_from_portfolio(trailing_pct)
    return {"synced": len(added), "positions": added}


# ---------------------------------------------------------------------------
# Manueller Check
# ---------------------------------------------------------------------------

@router.post("/check")
def manual_check():
    """Führt einen manuellen Trailing-Stop Check durch (wie der Background-Job)."""
    _require_alpaca()
    events = check_and_update()
    return {"events": events, "total_events": len(events)}
