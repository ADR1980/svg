"""RAG-Pipeline: Semantische Suche + Claude API für KI-Analyse."""

import anthropic

from config import ANTHROPIC_API_KEY, AI_MODEL, AI_MAX_TOKENS
from models.document import SearchQuery
from models.ai import AIQuery, AIResponse, AISource
from models.tenant import TenantContext
from services.document_service import search_documents


SYSTEM_PROMPT_DE = """Du bist ein KI-Analyst für SVG (Sentinel Vanguard Global), eine Plattform für globale Supply-Chain-Risikoanalyse und Verteidigungsbeschaffung.

Du analysierst Dokumente aus der SVG-Wissensdatenbank. Deine Aufgaben:
- Beantworte Fragen basierend auf dem bereitgestellten Kontext
- Referenziere Quellen mit ihrer RID (z.B. ri.svg.risk-report.2026-03-09-eastern-europe)
- Erkenne Zusammenhänge zwischen Dokumenten, Personen und Unternehmen
- Gib strukturierte, präzise Analysen

Wenn du keine relevanten Informationen im Kontext findest, sage das ehrlich.
Antworte auf Deutsch, es sei denn, der Nutzer fragt auf Englisch."""

SYSTEM_PROMPT_EN = """You are an AI analyst for SVG (Sentinel Vanguard Global), a platform for global supply chain risk analysis and defense procurement.

You analyze documents from the SVG knowledge base. Your tasks:
- Answer questions based on the provided context
- Reference sources with their RID (e.g. ri.svg.risk-report.2026-03-09-eastern-europe)
- Identify connections between documents, persons, and companies
- Provide structured, precise analyses

If you cannot find relevant information in the context, say so honestly.
Respond in English unless the user asks in German."""


def query_ai(query: AIQuery, tenant: TenantContext | None = None) -> AIResponse:
    """Führt eine tenant-scoped RAG-basierte KI-Analyse durch."""
    # 1. Semantische Suche nach relevantem Kontext (tenant-scoped)
    search = SearchQuery(
        query=query.question,
        doc_type=query.doc_type,
        threshold=0.5,
        limit=query.max_context_chunks,
    )
    search_results = search_documents(search, tenant=tenant) if tenant else search_documents(search)

    # 2. Kontext aus Suchergebnissen aufbauen
    context_parts = []
    sources = []
    seen_rids = set()

    for result in search_results:
        context_parts.append(
            f"[Quelle: {result.document_rid} | {result.title} | Relevanz: {result.similarity:.0%}]\n"
            f"{result.chunk_text}\n"
        )
        if result.document_rid not in seen_rids:
            sources.append(AISource(
                document_rid=result.document_rid,
                title=result.title,
                chunk_text=result.chunk_text[:300],
                similarity=result.similarity,
            ))
            seen_rids.add(result.document_rid)

    context = "\n---\n".join(context_parts) if context_parts else "Keine relevanten Dokumente gefunden."

    # 3. Claude API aufrufen
    system_prompt = SYSTEM_PROMPT_DE if query.language == "de" else SYSTEM_PROMPT_EN

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=AI_MODEL,
        max_tokens=AI_MAX_TOKENS,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Kontext aus der Wissensdatenbank ({len(search_results)} relevante Chunks):\n\n"
                    f"{context}\n\n"
                    f"---\n\n"
                    f"Frage: {query.question}"
                ),
            }
        ],
    )

    answer = message.content[0].text
    tokens_used = message.usage.input_tokens + message.usage.output_tokens

    return AIResponse(
        answer=answer,
        sources=sources,
        model=AI_MODEL,
        tokens_used=tokens_used,
    )


def is_ai_available() -> bool:
    """Prüft ob die KI-Analyse verfügbar ist (API-Key gesetzt)."""
    return bool(ANTHROPIC_API_KEY)
