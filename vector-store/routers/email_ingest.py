from fastapi import APIRouter, HTTPException

from services.email_service import (
    poll_and_ingest as imap_poll,
    get_status as imap_get_status,
    is_email_enabled as is_imap_enabled,
)
from services.msgraph_email_service import (
    poll_and_ingest as msgraph_poll,
    get_status as msgraph_get_status,
    is_msgraph_enabled,
)

router = APIRouter(prefix="/api/v1/email", tags=["Email-Import"])


def _format_status(status) -> dict:
    return {
        "enabled": status.enabled,
        "last_poll": status.last_poll.isoformat() if status.last_poll else None,
        "last_error": status.last_error,
        "emails_processed_total": status.emails_processed_total,
        "last_poll_count": status.last_poll_count,
    }


def _format_poll_result(results: list[dict]) -> dict:
    return {
        "imported": len([r for r in results if r["status"] == "created"]),
        "skipped": len([r for r in results if r["status"] in ("existing", "duplicate")]),
        "spam": len([r for r in results if r["status"] == "spam"]),
        "errors": len([r for r in results if r["status"].startswith("error")]),
        "details": results,
    }


# ─── Aggregierte Endpunkte ───────────────────────────────────────────────────


@router.get("/status")
def email_status():
    """Gibt den aggregierten Status aller Email-Provider zurück."""
    return {
        "imap": _format_status(imap_get_status()),
        "msgraph": _format_status(msgraph_get_status()),
    }


@router.post("/poll")
def poll_all():
    """Pollt alle aktiven Email-Provider."""
    results = []

    if is_imap_enabled():
        try:
            results.extend(imap_poll())
        except Exception as e:
            results.append({"rid": "imap-error", "title": "IMAP", "status": f"error: {e}"})

    if is_msgraph_enabled():
        try:
            results.extend(msgraph_poll())
        except Exception as e:
            results.append({"rid": "msgraph-error", "title": "Microsoft Graph", "status": f"error: {e}"})

    if not is_imap_enabled() and not is_msgraph_enabled():
        raise HTTPException(status_code=503, detail="Kein Email-Provider konfiguriert.")

    return _format_poll_result(results)


# ─── IMAP-spezifische Endpunkte ─────────────────────────────────────────────


@router.post("/imap/poll")
def poll_imap():
    """Manuelles IMAP-Polling."""
    if not is_imap_enabled():
        raise HTTPException(status_code=503, detail="IMAP nicht konfiguriert.")
    try:
        return _format_poll_result(imap_poll())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IMAP-Polling fehlgeschlagen: {e}")


# ─── Microsoft Graph-spezifische Endpunkte ──────────────────────────────────


@router.post("/msgraph/poll")
def poll_msgraph():
    """Manuelles Microsoft Graph-Polling."""
    if not is_msgraph_enabled():
        raise HTTPException(status_code=503, detail="Microsoft Graph nicht konfiguriert.")
    try:
        return _format_poll_result(msgraph_poll())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph-Polling fehlgeschlagen: {e}")
