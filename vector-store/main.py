import logging
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import API_HOST, API_PORT, EMAIL_POLL_INTERVAL_SECONDS
from routers import documents, search, entities
from routers.ai import router as ai_router
from routers.email_ingest import router as email_router
from routers.ingest import router as ingest_router

logger = logging.getLogger(__name__)

# Background-Scheduler für Email-Polling
_scheduler = None


def _start_email_scheduler():
    """Startet den Background-Scheduler für automatisches Email-Polling."""
    from services.email_service import is_email_enabled, poll_and_ingest

    if not is_email_enabled():
        logger.info("Email-Polling deaktiviert (IMAP nicht konfiguriert)")
        return

    from apscheduler.schedulers.background import BackgroundScheduler

    global _scheduler
    _scheduler = BackgroundScheduler()

    def _poll_job():
        try:
            results = poll_and_ingest()
            created = len([r for r in results if r["status"] == "created"])
            if created:
                logger.info("Email-Polling: %d neue Dokumente erstellt", created)
        except Exception as e:
            logger.error("Email-Polling Fehler: %s", e)

    _scheduler.add_job(
        _poll_job,
        "interval",
        seconds=EMAIL_POLL_INTERVAL_SECONDS,
        id="email_poll",
        name="Email-Polling",
    )
    _scheduler.start()
    logger.info(
        "Email-Polling gestartet (Intervall: %ds)", EMAIL_POLL_INTERVAL_SECONDS
    )


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
