from fastapi import APIRouter, HTTPException

from services.email_service import poll_and_ingest, get_status, is_email_enabled

router = APIRouter(prefix="/api/v1/email", tags=["Email-Import"])


@router.get("/status")
def email_status():
    """Gibt den aktuellen Status des Email-Polling zurück."""
    status = get_status()
    return {
        "enabled": status.enabled,
        "last_poll": status.last_poll.isoformat() if status.last_poll else None,
        "last_error": status.last_error,
        "emails_processed_total": status.emails_processed_total,
        "last_poll_count": status.last_poll_count,
    }


@router.post("/poll")
def poll_emails():
    """Manuelles Abrufen und Verarbeiten neuer E-Mails."""
    if not is_email_enabled():
        raise HTTPException(
            status_code=503,
            detail="Email-Ingestion nicht konfiguriert. IMAP_HOST, IMAP_EMAIL und IMAP_PASSWORD setzen.",
        )

    try:
        results = poll_and_ingest()
        return {
            "imported": len([r for r in results if r["status"] == "created"]),
            "skipped": len([r for r in results if r["status"] == "existing"]),
            "errors": len([r for r in results if r["status"].startswith("error")]),
            "details": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email-Polling fehlgeschlagen: {e}")
