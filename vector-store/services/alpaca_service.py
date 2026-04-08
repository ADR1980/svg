"""Alpaca Markets API – Verbindung, Portfolio, Orders und Marktdaten."""

import logging
from datetime import datetime

import httpx

from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL, ALPACA_PAPER

logger = logging.getLogger(__name__)

ALPACA_DATA_URL = "https://data.alpaca.markets"

_HEADERS = {
    "APCA-API-KEY-ID": ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
}


def _api(method: str, path: str, *, base: str | None = None, **kwargs) -> dict | list:
    """Zentraler API-Aufruf gegen Alpaca."""
    url = f"{base or ALPACA_BASE_URL}{path}"
    with httpx.Client(timeout=10.0) as client:
        resp = getattr(client, method)(url, headers=_HEADERS, **kwargs)
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# Verbindung
# ---------------------------------------------------------------------------

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
        data = _api("get", "/v2/account")
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


# ---------------------------------------------------------------------------
# Konto
# ---------------------------------------------------------------------------

def get_account() -> dict:
    """Gibt Kontoinformationen zurück (Kaufkraft, Portfolio-Wert, Cash)."""
    data = _api("get", "/v2/account")
    return {
        "account_id": data.get("id"),
        "status": data.get("status"),
        "cash": float(data.get("cash", 0)),
        "portfolio_value": float(data.get("portfolio_value", 0)),
        "buying_power": float(data.get("buying_power", 0)),
        "equity": float(data.get("equity", 0)),
        "currency": data.get("currency", "USD"),
        "paper_trading": ALPACA_PAPER,
    }


# ---------------------------------------------------------------------------
# Portfolio / Positionen
# ---------------------------------------------------------------------------

def get_positions() -> list[dict]:
    """Gibt alle offenen Positionen zurück."""
    data = _api("get", "/v2/positions")
    positions = []
    for p in data:
        positions.append({
            "symbol": p.get("symbol"),
            "qty": float(p.get("qty", 0)),
            "side": p.get("side"),
            "avg_entry_price": float(p.get("avg_entry_price", 0)),
            "current_price": float(p.get("current_price", 0)),
            "market_value": float(p.get("market_value", 0)),
            "unrealized_pl": float(p.get("unrealized_pl", 0)),
            "unrealized_plpc": float(p.get("unrealized_plpc", 0)),
            "change_today": float(p.get("change_today", 0)),
        })
    return positions


def get_portfolio_summary() -> dict:
    """Portfolio-Übersicht: Konto + alle Positionen."""
    account = get_account()
    positions = get_positions()
    total_pl = sum(p["unrealized_pl"] for p in positions)
    return {
        "account": account,
        "positions": positions,
        "total_positions": len(positions),
        "total_unrealized_pl": round(total_pl, 2),
    }


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def place_order(symbol: str, qty: int = 1, side: str = "buy") -> dict:
    """Platziert eine Market-Order."""
    data = _api("post", "/v2/orders", json={
        "symbol": symbol.upper(),
        "qty": str(qty),
        "side": side,
        "type": "market",
        "time_in_force": "day",
    })
    return {
        "order_id": data.get("id"),
        "symbol": data.get("symbol"),
        "qty": data.get("qty"),
        "side": data.get("side"),
        "type": data.get("type"),
        "status": data.get("status"),
        "created_at": data.get("created_at"),
    }


def get_orders(status: str = "all", limit: int = 20) -> list[dict]:
    """Gibt Orders zurück (all, open, closed)."""
    data = _api("get", "/v2/orders", params={"status": status, "limit": limit})
    orders = []
    for o in data:
        orders.append({
            "order_id": o.get("id"),
            "symbol": o.get("symbol"),
            "qty": o.get("qty"),
            "filled_qty": o.get("filled_qty"),
            "side": o.get("side"),
            "type": o.get("type"),
            "status": o.get("status"),
            "filled_avg_price": o.get("filled_avg_price"),
            "created_at": o.get("created_at"),
            "filled_at": o.get("filled_at"),
        })
    return orders


# ---------------------------------------------------------------------------
# Marktdaten
# ---------------------------------------------------------------------------

def get_quotes(symbols: list[str]) -> dict:
    """Gibt aktuelle Kurse für eine Liste von Symbolen zurück."""
    sym_str = ",".join(s.upper() for s in symbols)
    data = _api("get", "/v2/stocks/snapshots", base=ALPACA_DATA_URL, params={"symbols": sym_str})
    quotes = {}
    for sym, snap in data.items():
        trade = snap.get("latestTrade", {})
        quote = snap.get("latestQuote", {})
        daily = snap.get("dailyBar", {})
        quotes[sym] = {
            "price": trade.get("p"),
            "bid": quote.get("bp"),
            "ask": quote.get("ap"),
            "open": daily.get("o"),
            "high": daily.get("h"),
            "low": daily.get("l"),
            "close": daily.get("c"),
            "volume": daily.get("v"),
        }
    return quotes
