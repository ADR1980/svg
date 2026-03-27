from fastapi import APIRouter, HTTPException

from models.ai import AIQuery, AIResponse
from services.ai_service import query_ai, is_ai_available

router = APIRouter(prefix="/api/v1/ai", tags=["KI-Analyse"])


@router.get("/status")
def ai_status():
    """Prüft ob die KI-Analyse verfügbar ist."""
    return {"available": is_ai_available()}


@router.post("/query", response_model=AIResponse)
def ai_query(query: AIQuery):
    """RAG-basierte KI-Analyse: Durchsucht die Wissensdatenbank und generiert eine Antwort."""
    if not is_ai_available():
        raise HTTPException(
            status_code=503,
            detail="KI-Analyse nicht verfügbar. ANTHROPIC_API_KEY nicht konfiguriert.",
        )
    try:
        return query_ai(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KI-Analyse fehlgeschlagen: {e}")
