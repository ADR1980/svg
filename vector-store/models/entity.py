from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EntityResponse(BaseModel):
    """Ausgabe-Modell für eine erkannte Entität (Person oder Unternehmen)."""

    rid: str
    entity_type: str  # "person" oder "company"
    name: str
    mentioned_in: list[str] = []  # Liste von Dokument-RIDs
    metadata: dict[str, Any] = {}
    created_at: datetime
