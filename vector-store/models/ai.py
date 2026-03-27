from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AIQuery(BaseModel):
    """Eingabe-Modell für KI-Analyse."""

    question: str
    doc_type: str | None = None
    language: str = "de"
    max_context_chunks: int = Field(default=15, ge=1, le=50)


class AISource(BaseModel):
    """Eine Quelle die in der KI-Antwort referenziert wird."""

    document_rid: str
    title: str
    chunk_text: str
    similarity: float


class AIResponse(BaseModel):
    """Ausgabe-Modell für KI-Analyse."""

    answer: str
    sources: list[AISource]
    model: str
    tokens_used: int
