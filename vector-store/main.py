import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import API_HOST, API_PORT
from routers import documents, search, entities
from routers.ingest import router as ingest_router

app = FastAPI(
    title="SVG Vector Store",
    description="Palantir-inspirierte Dokumentenspeicherung mit Ontologie-RIDs und semantischer Suche",
    version="1.0.0",
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
app.include_router(ingest_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "svg-vector-store"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
