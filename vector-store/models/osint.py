from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class OSINTRequest(BaseModel):
    """Eingabe für eine OSINT-Recherche."""

    entity_rid: str | None = None
    entity_name: str | None = None
    entity_type: str | None = None  # "person" oder "company"
    language: str = "de"


class OSINTSource(BaseModel):
    """Eine einzelne OSINT-Quelle."""

    url: str | None = None
    title: str
    snippet: str
    source_type: str  # "web", "news", "vector_db"


class OSINTReport(BaseModel):
    """Strukturierter OSINT-Intelligence-Bericht."""

    entity_rid: str
    entity_name: str
    entity_type: str
    summary: str
    key_facts: list[str] = Field(default_factory=list)
    recent_news: list[str] = Field(default_factory=list)
    connections: list[str] = Field(default_factory=list)
    risk_indicators: list[str] = Field(default_factory=list)
    sources: list[OSINTSource] = Field(default_factory=list)
    report_rid: str
    model: str
    tokens_used: int
    created_at: datetime
