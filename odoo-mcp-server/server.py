"""
Odoo MCP Server — Generischer MCP Server für Odoo via XML-RPC.

Ermöglicht Claude Code den direkten Zugriff auf beliebige Odoo-Modelle:
Lesen, Erstellen, Bearbeiten, Löschen und Inspizieren von Datensätzen.
"""

import json
import os
import xmlrpc.client
from typing import Any

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# .env aus dem Verzeichnis des Servers laden
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ODOO_URL = os.environ.get("ODOO_URL", "")
ODOO_DB = os.environ.get("ODOO_DB", "")
ODOO_USERNAME = os.environ.get("ODOO_USERNAME", "")
ODOO_API_KEY = os.environ.get("ODOO_API_KEY", "")

mcp = FastMCP(
    "Odoo",
    instructions=(
        "MCP Server für Odoo ERP. Ermöglicht Zugriff auf alle Odoo-Modelle "
        "via XML-RPC: Datensätze suchen, lesen, erstellen, bearbeiten und löschen. "
        "Nutze odoo_list_models um verfügbare Modelle zu finden, "
        "odoo_fields_get um die Felder eines Modells zu inspizieren, "
        "und odoo_search_read um Daten abzufragen."
    ),
)

# ---------------------------------------------------------------------------
# Odoo XML-RPC Verbindung
# ---------------------------------------------------------------------------

_uid_cache: int | None = None


def _check_config() -> str | None:
    """Prüft ob alle Odoo-Konfigurationswerte gesetzt sind."""
    missing = []
    if not ODOO_URL:
        missing.append("ODOO_URL")
    if not ODOO_DB:
        missing.append("ODOO_DB")
    if not ODOO_USERNAME:
        missing.append("ODOO_USERNAME")
    if not ODOO_API_KEY:
        missing.append("ODOO_API_KEY")
    if missing:
        return f"Fehlende Umgebungsvariablen: {', '.join(missing)}"
    return None


def _authenticate() -> int:
    """Authentifiziert bei Odoo und gibt die User-ID zurück (mit Cache)."""
    global _uid_cache
    if _uid_cache is not None:
        return _uid_cache

    err = _check_config()
    if err:
        raise RuntimeError(err)

    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common")
    uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {})
    if not uid:
        raise RuntimeError(
            "Odoo-Authentifizierung fehlgeschlagen. "
            "Bitte ODOO_URL, ODOO_DB, ODOO_USERNAME und ODOO_API_KEY prüfen."
        )
    _uid_cache = uid
    return uid


def _execute(model: str, method: str, args: list, kwargs: dict | None = None) -> Any:
    """Führt einen execute_kw Aufruf auf dem Odoo Object-Endpoint aus."""
    uid = _authenticate()
    models = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object")
    return models.execute_kw(
        ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs or {}
    )


# ---------------------------------------------------------------------------
# MCP Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def odoo_search_read(
    model: str,
    domain: list[list] | None = None,
    fields: list[str] | None = None,
    limit: int = 20,
    offset: int = 0,
    order: str | None = None,
) -> str:
    """Datensätze in einem Odoo-Modell suchen und lesen.

    Args:
        model: Technischer Modellname, z.B. 'res.partner', 'sale.order', 'product.product'
        domain: Odoo-Domain-Filter als Liste von Tripeln, z.B. [['is_company','=',True]].
                Leer = alle Datensätze.
        fields: Liste der gewünschten Felder, z.B. ['name','email'].
                Leer = alle Felder.
        limit: Maximale Anzahl Datensätze (Standard: 20).
        offset: Anzahl zu überspringender Datensätze (für Paginierung).
        order: Sortierung, z.B. 'name asc' oder 'create_date desc'.
    """
    try:
        kwargs: dict[str, Any] = {"limit": limit, "offset": offset}
        if fields:
            kwargs["fields"] = fields
        if order:
            kwargs["order"] = order
        records = _execute(model, "search_read", [domain or []], kwargs)
        return json.dumps(records, default=str, ensure_ascii=False)
    except Exception as e:
        return f"Fehler: {e}"


@mcp.tool()
def odoo_read(
    model: str,
    ids: list[int],
    fields: list[str] | None = None,
) -> str:
    """Bestimmte Datensätze per ID aus einem Odoo-Modell lesen.

    Args:
        model: Technischer Modellname, z.B. 'res.partner'.
        ids: Liste der Datensatz-IDs, z.B. [1, 5, 12].
        fields: Liste der gewünschten Felder. Leer = alle Felder.
    """
    try:
        kwargs: dict[str, Any] = {}
        if fields:
            kwargs["fields"] = fields
        records = _execute(model, "read", [ids], kwargs)
        return json.dumps(records, default=str, ensure_ascii=False)
    except Exception as e:
        return f"Fehler: {e}"


@mcp.tool()
def odoo_create(
    model: str,
    values: dict[str, Any],
) -> str:
    """Einen neuen Datensatz in einem Odoo-Modell erstellen.

    Args:
        model: Technischer Modellname, z.B. 'res.partner'.
        values: Dict mit Feldwerten, z.B. {'name': 'Firma GmbH', 'email': 'info@firma.de'}.
    """
    try:
        record_id = _execute(model, "create", [values])
        return json.dumps(
            {"success": True, "id": record_id},
            default=str,
            ensure_ascii=False,
        )
    except Exception as e:
        return f"Fehler: {e}"


@mcp.tool()
def odoo_write(
    model: str,
    ids: list[int],
    values: dict[str, Any],
) -> str:
    """Bestehende Datensätze in einem Odoo-Modell aktualisieren.

    Args:
        model: Technischer Modellname, z.B. 'res.partner'.
        ids: Liste der zu aktualisierenden Datensatz-IDs.
        values: Dict mit den zu ändernden Feldwerten.
    """
    try:
        result = _execute(model, "write", [ids, values])
        return json.dumps(
            {"success": bool(result), "updated_ids": ids},
            default=str,
            ensure_ascii=False,
        )
    except Exception as e:
        return f"Fehler: {e}"


@mcp.tool()
def odoo_unlink(
    model: str,
    ids: list[int],
) -> str:
    """Datensätze aus einem Odoo-Modell löschen.

    Args:
        model: Technischer Modellname, z.B. 'res.partner'.
        ids: Liste der zu löschenden Datensatz-IDs.
    """
    try:
        result = _execute(model, "unlink", [ids])
        return json.dumps(
            {"success": bool(result), "deleted_ids": ids},
            default=str,
            ensure_ascii=False,
        )
    except Exception as e:
        return f"Fehler: {e}"


@mcp.tool()
def odoo_fields_get(
    model: str,
    attributes: list[str] | None = None,
) -> str:
    """Felddefinitionen eines Odoo-Modells abrufen.

    Nützlich um herauszufinden, welche Felder ein Modell hat,
    welche Typen sie haben und ob sie Pflichtfelder sind.

    Args:
        model: Technischer Modellname, z.B. 'res.partner'.
        attributes: Gewünschte Feld-Attribute, z.B. ['string','type','required'].
                    Leer = alle Attribute.
    """
    try:
        kwargs: dict[str, Any] = {}
        if attributes:
            kwargs["attributes"] = attributes
        fields_info = _execute(model, "fields_get", [], kwargs)
        return json.dumps(fields_info, default=str, ensure_ascii=False)
    except Exception as e:
        return f"Fehler: {e}"


@mcp.tool()
def odoo_list_models(
    search: str | None = None,
) -> str:
    """Verfügbare Odoo-Modelle auflisten.

    Args:
        search: Optionaler Suchbegriff zum Filtern nach Modellname,
                z.B. 'sale' findet 'sale.order', 'sale.order.line' usw.
    """
    try:
        domain: list[list] = []
        if search:
            domain = [["model", "ilike", search]]
        models = _execute(
            "ir.model",
            "search_read",
            [domain],
            {"fields": ["model", "name"], "order": "model asc", "limit": 100},
        )
        return json.dumps(models, default=str, ensure_ascii=False)
    except Exception as e:
        return f"Fehler: {e}"


# ---------------------------------------------------------------------------
# Server starten
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
