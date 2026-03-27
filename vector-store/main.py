import logging
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import API_HOST, API_PORT, EMAIL_POLL_INTERVAL_SECONDS, MSGRAPH_POLL_INTERVAL_SECONDS
from routers import documents, search, entities
from routers.ai import router as ai_router
from routers.auth import router as auth_router
from routers.email_ingest import router as email_router
from routers.ingest import router as ingest_router
from routers.tenants import router as tenants_router

logger = logging.getLogger(__name__)

# Background-Scheduler für Email-Polling
_scheduler = None


def _make_poll_job(poll_fn, label: str):
    """Factory für Polling-Jobs."""
    def _job():
        try:
            results = poll_fn()
            created = len([r for r in results if r["status"] == "created"])
            if created:
                logger.info("%s-Polling: %d neue Dokumente erstellt", label, created)
        except Exception as e:
            logger.error("%s-Polling Fehler: %s", label, e)
    return _job


def _start_email_scheduler():
    """Startet den Background-Scheduler für automatisches Email-Polling (IMAP + Graph)."""
    from services.email_service import is_email_enabled, poll_and_ingest as imap_poll
    from services.msgraph_email_service import is_msgraph_enabled, poll_and_ingest as msgraph_poll

    imap_on = is_email_enabled()
    msgraph_on = is_msgraph_enabled()

    if not imap_on and not msgraph_on:
        logger.info("Email-Polling deaktiviert (weder IMAP noch Microsoft Graph konfiguriert)")
        return

    from apscheduler.schedulers.background import BackgroundScheduler

    global _scheduler
    _scheduler = BackgroundScheduler()

    if imap_on:
        _scheduler.add_job(
            _make_poll_job(imap_poll, "IMAP"),
            "interval",
            seconds=EMAIL_POLL_INTERVAL_SECONDS,
            id="email_poll_imap",
            name="IMAP-Polling",
        )
        logger.info("IMAP-Polling gestartet (Intervall: %ds)", EMAIL_POLL_INTERVAL_SECONDS)

    if msgraph_on:
        _scheduler.add_job(
            _make_poll_job(msgraph_poll, "Graph"),
            "interval",
            seconds=MSGRAPH_POLL_INTERVAL_SECONDS,
            id="email_poll_msgraph",
            name="Graph-Polling",
        )
        logger.info("Graph-Polling gestartet (Intervall: %ds)", MSGRAPH_POLL_INTERVAL_SECONDS)

    _scheduler.start()


def _stop_email_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Email-Polling gestoppt")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _start_email_scheduler()
    yield
    _stop_email_scheduler()


app = FastAPI(
    title="SVG Vector Store",
    description="Palantir-inspirierte Dokumentenspeicherung mit Ontologie-RIDs und semantischer Suche",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tenants_router)
app.include_router(documents.router)
app.include_router(search.router)
app.include_router(entities.router)
app.include_router(ai_router)
app.include_router(email_router)
app.include_router(ingest_router)

# Static Files für UI
ui_dir = Path(__file__).parent / "ui"
if ui_dir.exists():
    app.mount("/ui", StaticFiles(directory=str(ui_dir), html=True), name="ui")


@app.get("/health")
def health():
    return {"status": "ok", "service": "svg-vector-store"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
