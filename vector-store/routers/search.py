from fastapi import APIRouter

from models.document import SearchQuery, SearchResult
from services.document_service import search_documents

router = APIRouter(prefix="/api/v1/search", tags=["Suche"])


@router.post("", response_model=list[SearchResult])
def search(query: SearchQuery):
    """Semantische Suche über alle Dokumente.

    Durchsucht Dokument-Chunks mittels Vektor-Ähnlichkeit (Cosine Similarity).
    Optional nach Dokumenttyp filterbar.
    """
    return search_documents(query)
