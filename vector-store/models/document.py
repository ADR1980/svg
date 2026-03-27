from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    """Eingabe-Modell zum Erstellen eines Dokuments."""

    doc_type: str
    title: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    language: str = "de"
    source: str | None = None
    rid: str | None = None  # Optional: manuell setzen, sonst automatisch generiert


class DocumentResponse(BaseModel):
    """Ausgabe-Modell für ein Dokument."""

    rid: str
    doc_type: str
    title: str
    content: str
    metadata: dict[str, Any]
    language: str
    source: str | None
    created_at: datetime
    updated_at: datetime


class DocumentChunkResponse(BaseModel):
    """Ausgabe-Modell für einen Dokument-Chunk."""

    id: int
    document_rid: str
    chunk_index: int
    chunk_text: str
    metadata: dict[str, Any]


class SearchQuery(BaseModel):
    """Eingabe-Modell für semantische Suche."""

    query: str
    doc_type: str | None = None
    threshold: float = 0.7
    limit: int = 10


class SearchResult(BaseModel):
    """Einzelnes Suchergebnis."""

    document_rid: str
    chunk_text: str
    similarity: float
    doc_type: str
    title: str
    metadata: dict[str, Any]


class DocumentLinkCreate(BaseModel):
    """Eingabe-Modell zum Verknüpfen von Dokumenten."""

    target_rid: str
    link_type: str = "relates-to"
    metadata: dict[str, Any] = Field(default_factory=dict)


class DocumentLinkResponse(BaseModel):
    """Ausgabe-Modell für eine Dokument-Verknüpfung."""

    source_rid: str
    target_rid: str
    link_type: str
    metadata: dict[str, Any]
    created_at: datetime
