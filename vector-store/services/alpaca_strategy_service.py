"""Trailing-Stop Handelsstrategie für Alpaca Markets.

Strategie-Logik:
1. Für jede überwachte Position wird der Höchstkurs (High Water Mark) getrackt
2. Der Stop-Loss liegt immer X% unter dem Höchstkurs (Trailing)
3. Steigt der Kurs → Stop-Loss steigt automatisch mit
4. Fällt der Kurs unter den Stop-Loss → automatischer Verkauf
5. Trade-Kosten (Spread + Fixkosten) werden bei der Gewinnberechnung abgezogen
6. Der Trailing-Stop aktiviert sich erst ab einer Mindest-Rendite (Break-Even + Kosten)

Echtzeit-Monitoring läuft als Background-Job im APScheduler.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock

from config import (
    TRAILING_STOP_PCT,
    TRAILING_MIN_PROFIT_PCT,
    TRAILING_COST_PER_TRADE,
    TRAILING_SPREAD_PCT,
)
from services.alpaca_service import get_quotes, place_order, get_positions, is_alpaca_configured

logger = logging.getLogger(__name__)

_lock = Lock()


@dataclass
class TrackedPosition:
    """Eine überwachte Position mit Trailing-Stop."""
    symbol: str
    qty: int
    entry_price: float
    high_water_mark: float
    stop_price: float
    trailing_pct: float
    trailing_active: bool = False
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    sold: bool = False
    sold_at: str | None = None
    sell_price: float | None = None
    sell_reason: str | None = None
    total_cost: float = 0.0

    @property
    def cost_per_share(self) -> float:
        """Gesamtkosten pro Aktie (Spread + Fixkosten)."""
        spread_cost = self.entry_price * (TRAILING_SPREAD_PCT / 100)
        fix_cost = TRAILING_COST_PER_TRADE / max(self.qty, 1)
        return spread_cost + fix_cost

    @property
    def break_even_price(self) -> float:
        """Mindest-Verkaufspreis um Kosten zu decken (Kauf + Verkauf)."""
        return self.entry_price + (2 * self.cost_per_share)

    @property
    def min_profit_price(self) -> float:
        """Mindest-Kurs bevor Trailing-Stop aktiviert wird."""
        min_profit = self.entry_price * (TRAILING_MIN_PROFIT_PCT / 100)
        return self.break_even_price + min_profit


# Globaler State: aktive Überwachungen
_tracked: dict[str, TrackedPosition] = {}
# Verkaufs-Log
_trade_log: list[dict] = []


def _calc_stop_price(high: float, trailing_pct: float) -> float:
    """Berechnet den Stop-Preis basierend auf High Water Mark."""
    return round(high * (1 - trailing_pct / 100), 4)


def add_position(symbol: str, qty: int, entry_price: float,
                 trailing_pct: float | None = None) -> dict:
    """Fügt eine Position zur Trailing-Stop Überwachung hinzu."""
    symbol = symbol.upper()
    pct = trailing_pct or TRAILING_STOP_PCT

    with _lock:
        pos = TrackedPosition(
            symbol=symbol,
            qty=qty,
            entry_price=entry_price,
            high_water_mark=entry_price,
            stop_price=_calc_stop_price(entry_price, pct),
            trailing_pct=pct,
            total_cost=2 * (entry_price * (TRAILING_SPREAD_PCT / 100) * qty + TRAILING_COST_PER_TRADE),
        )
        _tracked[symbol] = pos
        logger.info(
            "Trailing-Stop aktiviert: %s | Entry: $%.2f | Stop: $%.2f (%.1f%%) | "
            "Break-Even: $%.2f | Trailing ab: $%.2f",
            symbol, entry_price, pos.stop_price, pct,
            pos.break_even_price, pos.min_profit_price,
        )

    return _format_position(pos)


def remove_position(symbol: str) -> bool:
    """Entfernt eine Position aus der Überwachung."""
    with _lock:
        return _tracked.pop(symbol.upper(), None) is not None


def sync_from_portfolio(trailing_pct: float | None = None) -> list[dict]:
    """Synchronisiert alle offenen Alpaca-Positionen in die Überwachung."""
    positions = get_positions()
    added = []
    for p in positions:
        sym = p["symbol"]
        if sym not in _tracked:
            result = add_position(
                sym,
                qty=int(p["qty"]),
                entry_price=p["avg_entry_price"],
                trailing_pct=trailing_pct,
            )
            added.append(result)
    return added


def check_and_update() -> list[dict]:
    """Kernlogik: Prüft alle Positionen, passt Stops an, verkauft bei Trigger.

    Wird vom Background-Scheduler aufgerufen.
    """
    if not is_alpaca_configured():
        return []

    with _lock:
        active = {s: p for s, p in _tracked.items() if not p.sold}

    if not active:
        return []

    # Kurse für alle überwachten Symbole abrufen
    try:
        quotes = get_quotes(list(active.keys()))
    except Exception as e:
        logger.error("Trailing-Stop: Kursabfrage fehlgeschlagen: %s", e)
        return []

    events = []
    for symbol, pos in active.items():
        quote = quotes.get(symbol)
        if not quote or not quote.get("price"):
            continue

        current_price = quote["price"]

        with _lock:
            # 1. High Water Mark aktualisieren
            if current_price > pos.high_water_mark:
                old_hwm = pos.high_water_mark
                pos.high_water_mark = current_price
                old_stop = pos.stop_price
                pos.stop_price = _calc_stop_price(current_price, pos.trailing_pct)

                logger.info(
                    "↑ %s: Neues Hoch $%.2f (vorher $%.2f) → Stop angehoben: $%.2f → $%.2f",
                    symbol, current_price, old_hwm, old_stop, pos.stop_price,
                )
                events.append({
                    "type": "stop_raised",
                    "symbol": symbol,
                    "current_price": current_price,
                    "new_high": current_price,
                    "old_stop": old_stop,
                    "new_stop": pos.stop_price,
                    "timestamp": datetime.now().isoformat(),
                })

            # 2. Trailing-Aktivierung prüfen (erst ab Mindest-Gewinn)
            if not pos.trailing_active and current_price >= pos.min_profit_price:
                pos.trailing_active = True
                logger.info(
                    "✓ %s: Trailing-Stop AKTIV (Kurs $%.2f >= Mindest $%.2f)",
                    symbol, current_price, pos.min_profit_price,
                )
                events.append({
                    "type": "trailing_activated",
                    "symbol": symbol,
                    "current_price": current_price,
                    "min_profit_price": pos.min_profit_price,
                    "timestamp": datetime.now().isoformat(),
                })

            # 3. Stop-Loss Trigger prüfen
            if pos.trailing_active and current_price <= pos.stop_price:
                logger.warning(
                    "⚠ %s: STOP-LOSS AUSGELÖST! Kurs $%.2f <= Stop $%.2f → VERKAUF",
                    symbol, current_price, pos.stop_price,
                )
                sell_event = _execute_sell(pos, current_price, "trailing_stop")
                events.append(sell_event)

    return events


def _execute_sell(pos: TrackedPosition, trigger_price: float, reason: str) -> dict:
    """Führt den Verkauf durch und loggt das Ergebnis."""
    try:
        order = place_order(pos.symbol, pos.qty, "sell")
        pos.sold = True
        pos.sold_at = datetime.now().isoformat()
        pos.sell_price = trigger_price
        pos.sell_reason = reason

        gross_pl = (trigger_price - pos.entry_price) * pos.qty
        net_pl = gross_pl - pos.total_cost
        net_pl_pct = (net_pl / (pos.entry_price * pos.qty)) * 100

        trade_record = {
            "type": "sell_executed",
            "symbol": pos.symbol,
            "qty": pos.qty,
            "entry_price": pos.entry_price,
            "sell_price": trigger_price,
            "high_water_mark": pos.high_water_mark,
            "gross_pl": round(gross_pl, 2),
            "total_costs": round(pos.total_cost, 2),
            "net_pl": round(net_pl, 2),
            "net_pl_pct": round(net_pl_pct, 2),
            "reason": reason,
            "order_id": order.get("order_id"),
            "order_status": order.get("status"),
            "timestamp": datetime.now().isoformat(),
        }
        _trade_log.append(trade_record)

        logger.info(
            "VERKAUFT %s: %d Stk. @ $%.2f | Brutto: $%.2f | Kosten: $%.2f | Netto: $%.2f (%.2f%%)",
            pos.symbol, pos.qty, trigger_price, gross_pl, pos.total_cost, net_pl, net_pl_pct,
        )
        return trade_record

    except Exception as e:
        logger.error("Verkauf fehlgeschlagen %s: %s", pos.symbol, e)
        return {
            "type": "sell_failed",
            "symbol": pos.symbol,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


# ---------------------------------------------------------------------------
# Status & Reporting
# ---------------------------------------------------------------------------

def _format_position(pos: TrackedPosition, current_price: float | None = None) -> dict:
    """Formatiert eine TrackedPosition für die API-Ausgabe."""
    cp = current_price or pos.high_water_mark
    gross_pl = (cp - pos.entry_price) * pos.qty
    net_pl = gross_pl - pos.total_cost

    return {
        "symbol": pos.symbol,
        "qty": pos.qty,
        "entry_price": pos.entry_price,
        "current_price": cp,
        "high_water_mark": pos.high_water_mark,
        "stop_price": pos.stop_price,
        "trailing_pct": pos.trailing_pct,
        "trailing_active": pos.trailing_active,
        "break_even_price": round(pos.break_even_price, 4),
        "min_profit_price": round(pos.min_profit_price, 4),
        "total_costs": round(pos.total_cost, 2),
        "gross_pl": round(gross_pl, 2),
        "net_pl": round(net_pl, 2),
        "sold": pos.sold,
        "sell_reason": pos.sell_reason,
        "created_at": pos.created_at,
    }


def get_strategy_status() -> dict:
    """Gibt den vollständigen Status aller überwachten Positionen zurück."""
    # Live-Kurse abrufen
    active_symbols = [s for s, p in _tracked.items() if not p.sold]
    quotes = {}
    if active_symbols:
        try:
            quotes = get_quotes(active_symbols)
        except Exception:
            pass

    positions = []
    for sym, pos in _tracked.items():
        cp = quotes.get(sym, {}).get("price") if not pos.sold else pos.sell_price
        positions.append(_format_position(pos, cp))

    active = [p for p in positions if not p["sold"]]
    sold = [p for p in positions if p["sold"]]

    return {
        "strategy": "trailing_stop",
        "config": {
            "trailing_stop_pct": TRAILING_STOP_PCT,
            "min_profit_pct": TRAILING_MIN_PROFIT_PCT,
            "cost_per_trade": TRAILING_COST_PER_TRADE,
            "spread_pct": TRAILING_SPREAD_PCT,
        },
        "active_positions": active,
        "sold_positions": sold,
        "total_active": len(active),
        "total_sold": len(sold),
        "trade_log": _trade_log,
    }
