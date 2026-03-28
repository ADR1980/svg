"""OSINT Agent Service.

Recherchiert öffentlich verfügbare Informationen zu Personen und Unternehmen,
verknüpft sie mit der internen Wissensdatenbank und erstellt strukturierte
Intelligence-Berichte via Claude API.
"""

import json
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from slugify import slugify

from config import (
    ANTHROPIC_API_KEY,
    AI_MODEL,
    AI_MAX_TOKENS,
    OSINT_COOLDOWN_SECONDS,
    OSINT_MAX_WEB_RESULTS,
    OSINT_MAX_NEWS_RESULTS,
)
from models.document import DocumentCreate, DocumentLinkCreate, SearchQuery
from models.osint import OSINTReport, OSINTSource
from models.tenant import TenantContext

logger = logging.getLogger(__name__)

# Rate-Limiting: letzte Recherche pro Entity
_last_investigation: dict[str, float] = {}


def is_osint_available() -> bool:
    return bool(ANTHROPIC_API_KEY)


# ─── Web-Suche ───────────────────────────────────────────────────────────────


def _search_web(name: str, entity_type: str) -> list[OSINTSource]:
    """Durchsucht das Web via DuckDuckGo."""
    try:
        from duckduckgo_search import DDGS

        type_hint = "Unternehmen Firma" if entity_type == "company" else "Person"
        query = f'"{name}" {type_hint}'

        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=OSINT_MAX_WEB_RESULTS):
                results.append(OSINTSource(
                    url=r.get("href"),
                    title=r.get("title", ""),
                    snippet=r.get("body", ""),
                    source_type="web",
                ))
        logger.info("OSINT Web-Suche: %d Ergebnisse für '%s'", len(results), name)
        return results
    except Exception as e:
        logger.warning("OSINT Web-Suche fehlgeschlagen: %s", e)
        return []


def _search_news(name: str, entity_type: str) -> list[OSINTSource]:
    """Durchsucht Nachrichten via DuckDuckGo News."""
    try:
        from duckduckgo_search import DDGS

        results = []
        with DDGS() as ddgs:
            for r in ddgs.news(f'"{name}"', max_results=OSINT_MAX_NEWS_RESULTS):
                results.append(OSINTSource(
                    url=r.get("url"),
                    title=r.get("title", ""),
                    snippet=r.get("body", ""),
                    source_type="news",
                ))
        logger.info("OSINT News-Suche: %d Ergebnisse für '%s'", len(results), name)
        return results
    except Exception as e:
        logger.warning("OSINT News-Suche fehlgeschlagen: %s", e)
        return []


def _search_vector_db(entity_rid: str, entity_name: str, tenant: TenantContext) -> list[OSINTSource]:
    """Durchsucht die interne Wissensdatenbank."""
    try:
        from services.document_service import search_documents, get_links

        # Semantische Suche nach Entity-Name
        query = SearchQuery(query=entity_name, threshold=0.5, limit=10)
        search_results = search_documents(query, tenant)

        sources = []
        for r in search_results:
            # Eigenes Entity-Dokument und Intelligence-Docs überspringen
            if r.document_rid == entity_rid:
                continue
            sources.append(OSINTSource(
                url=None,
                title=f"{r.title} ({r.doc_type})",
                snippet=r.chunk_text[:300],
                source_type="vector_db",
            ))

        # Erwähnungen via Links
        links = get_links(entity_rid, tenant)
        for link in links:
            if link.link_type == "mentions":
                sources.append(OSINTSource(
                    url=None,
                    title=f"Erwähnt in: {link.source_rid}",
                    snippet=link.metadata.get("context", "")[:300],
                    source_type="vector_db",
                ))

        logger.info("OSINT DB-Suche: %d Ergebnisse für '%s'", len(sources), entity_name)
        return sources
    except Exception as e:
        logger.warning("OSINT DB-Suche fehlgeschlagen: %s", e)
        return []


# ─── Claude-Synthese ─────────────────────────────────────────────────────────


SYSTEM_PROMPT = """Du bist ein OSINT-Analyst für SVG (Sentinel Vanguard Global).
Du erstellst strukturierte Intelligence-Berichte basierend auf öffentlich verfügbaren Informationen.

Erstelle einen Intelligence-Bericht im folgenden JSON-Format:
{
  "summary": "2-3 Sätze Zusammenfassung der wichtigsten Erkenntnisse",
  "key_facts": ["Fakt 1", "Fakt 2", "..."],
  "recent_news": ["Nachricht/Ereignis 1", "..."],
  "connections": ["Verbindung zu Person/Unternehmen X", "..."],
  "risk_indicators": ["Risikoindikator 1 (falls vorhanden)", "..."]
}

Regeln:
- Basiere dich NUR auf die bereitgestellten Quellen
- Wenn keine Informationen verfügbar sind, sage das ehrlich
- Kennzeichne unsichere Informationen als solche
- Gib NUR valides JSON zurück, keinen weiteren Text
- Antworte auf {language}"""


def _synthesize_report(
    entity_name: str,
    entity_type: str,
    web_results: list[OSINTSource],
    news_results: list[OSINTSource],
    db_results: list[OSINTSource],
    language: str,
) -> tuple[dict, int]:
    """Synthesisiert alle Quellen zu einem strukturierten Report via Claude."""
    import anthropic

    # Kontext zusammenbauen
    parts = [f"OSINT-Recherche für {'Unternehmen' if entity_type == 'company' else 'Person'}: {entity_name}\n"]

    if web_results:
        parts.append(f"\n=== Web-Suchergebnisse ({len(web_results)}) ===")
        for s in web_results:
            parts.append(f"- {s.title}\n  URL: {s.url}\n  {s.snippet}")

    if news_results:
        parts.append(f"\n=== Aktuelle Nachrichten ({len(news_results)}) ===")
        for s in news_results:
            parts.append(f"- {s.title}\n  URL: {s.url}\n  {s.snippet}")

    if db_results:
        parts.append(f"\n=== Interne Wissensdatenbank ({len(db_results)} Treffer) ===")
        for s in db_results:
            parts.append(f"- {s.title}\n  {s.snippet}")

    if not web_results and not news_results and not db_results:
        parts.append("\nKeine Informationen gefunden.")

    parts.append("\nErstelle einen strukturierten Intelligence-Bericht als JSON.")

    user_message = "\n".join(parts)
    system = SYSTEM_PROMPT.replace("{language}", "Deutsch" if language == "de" else "English")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=AI_MODEL,
        max_tokens=AI_MAX_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_text = response.content[0].text.strip()
    tokens_used = response.usage.input_tokens + response.usage.output_tokens

    # JSON aus Antwort parsen (Claude wraps manchmal in ```json```)
    json_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
    json_text = re.sub(r"\s*```$", "", json_text)

    try:
        report_data = json.loads(json_text)
    except json.JSONDecodeError:
        report_data = {
            "summary": raw_text,
            "key_facts": [],
            "recent_news": [],
            "connections": [],
            "risk_indicators": [],
        }

    return report_data, tokens_used


# ─── Report speichern ────────────────────────────────────────────────────────


def _store_report(
    entity_rid: str,
    entity_name: str,
    entity_type: str,
    report_data: dict,
    sources: list[OSINTSource],
    tenant: TenantContext,
) -> str:
    """Speichert den OSINT-Report als Intelligence-Dokument und verlinkt ihn."""
    from services.document_service import create_document, create_link

    date_str = datetime.now().strftime("%Y-%m-%d")
    name_slug = slugify(entity_name, max_length=50)
    rid = f"ri.{tenant.tenant_id}.intelligence.osint-{name_slug}-{date_str}"

    # Report als lesbaren Text formatieren
    content_parts = [
        f"OSINT Intelligence-Bericht: {entity_name}",
        f"Typ: {'Unternehmen' if entity_type == 'company' else 'Person'}",
        f"Erstellt: {date_str}",
        "",
        "## Zusammenfassung",
        report_data.get("summary", "Keine Zusammenfassung verfügbar."),
        "",
    ]

    if report_data.get("key_facts"):
        content_parts.append("## Wichtige Fakten")
        for fact in report_data["key_facts"]:
            content_parts.append(f"- {fact}")
        content_parts.append("")

    if report_data.get("recent_news"):
        content_parts.append("## Aktuelle Nachrichten")
        for news in report_data["recent_news"]:
            content_parts.append(f"- {news}")
        content_parts.append("")

    if report_data.get("connections"):
        content_parts.append("## Verbindungen")
        for conn in report_data["connections"]:
            content_parts.append(f"- {conn}")
        content_parts.append("")

    if report_data.get("risk_indicators"):
        content_parts.append("## Risikoindikatoren")
        for risk in report_data["risk_indicators"]:
            content_parts.append(f"- {risk}")
        content_parts.append("")

    content = "\n".join(content_parts)

    doc = DocumentCreate(
        doc_type="intelligence",
        title=f"OSINT: {entity_name} ({date_str})",
        content=content,
        metadata={
            "osint_entity_rid": entity_rid,
            "osint_entity_type": entity_type,
            "osint_sources_count": len(sources),
            "osint_generated_at": datetime.now().isoformat(),
            "osint_report": report_data,
        },
        language="de",
        source="osint-agent",
        rid=rid,
    )

    result = create_document(doc, tenant=tenant, extract_entities_flag=False, skip_checks=True)

    # Link: Entity --has-intelligence--> Report
    try:
        link = DocumentLinkCreate(target_rid=result.rid, link_type="has-intelligence")
        create_link(entity_rid, link, tenant=tenant)
    except Exception as e:
        logger.warning("OSINT-Link konnte nicht erstellt werden: %s", e)

    return result.rid


# ─── Haupt-Orchestrierung ────────────────────────────────────────────────────


def investigate_entity(entity_rid: str, entity_name: str, entity_type: str, language: str, tenant: TenantContext) -> OSINTReport:
    """Führt eine vollständige OSINT-Recherche für eine Entität durch."""

    # Rate-Limiting prüfen
    last = _last_investigation.get(entity_rid, 0)
    if time.time() - last < OSINT_COOLDOWN_SECONDS:
        remaining = int(OSINT_COOLDOWN_SECONDS - (time.time() - last))
        raise ValueError(f"OSINT-Cooldown: Bitte {remaining}s warten vor erneuter Recherche")

    _last_investigation[entity_rid] = time.time()

    # Parallel suchen
    with ThreadPoolExecutor(max_workers=3) as executor:
        web_future = executor.submit(_search_web, entity_name, entity_type)
        news_future = executor.submit(_search_news, entity_name, entity_type)
        db_future = executor.submit(_search_vector_db, entity_rid, entity_name, tenant)

        web_results = web_future.result()
        news_results = news_future.result()
        db_results = db_future.result()

    all_sources = web_results + news_results + db_results

    # Claude-Synthese
    report_data, tokens_used = _synthesize_report(
        entity_name, entity_type, web_results, news_results, db_results, language
    )

    # Report speichern
    report_rid = _store_report(entity_rid, entity_name, entity_type, report_data, all_sources, tenant)

    return OSINTReport(
        entity_rid=entity_rid,
        entity_name=entity_name,
        entity_type=entity_type,
        summary=report_data.get("summary", ""),
        key_facts=report_data.get("key_facts", []),
        recent_news=report_data.get("recent_news", []),
        connections=report_data.get("connections", []),
        risk_indicators=report_data.get("risk_indicators", []),
        sources=all_sources,
        report_rid=report_rid,
        model=AI_MODEL,
        tokens_used=tokens_used,
        created_at=datetime.now(),
    )


def get_latest_report(entity_rid: str, tenant: TenantContext) -> OSINTReport | None:
    """Gibt den neuesten OSINT-Report für eine Entität zurück."""
    from services.document_service import get_links, get_document

    links = get_links(entity_rid, tenant)
    intel_links = [l for l in links if l.link_type == "has-intelligence"]

    if not intel_links:
        return None

    # Neuester Report (nach created_at sortiert)
    intel_links.sort(key=lambda l: l.created_at, reverse=True)
    latest_rid = intel_links[0].target_rid

    doc = get_document(latest_rid, tenant)
    if not doc:
        return None

    report_data = doc.metadata.get("osint_report", {})

    # Sources aus Metadata rekonstruieren
    sources = []
    for s in doc.metadata.get("osint_sources", []):
        sources.append(OSINTSource(**s))

    return OSINTReport(
        entity_rid=entity_rid,
        entity_name=doc.metadata.get("osint_entity_rid", entity_rid).split(".")[-1],
        entity_type=doc.metadata.get("osint_entity_type", "unknown"),
        summary=report_data.get("summary", doc.content[:200]),
        key_facts=report_data.get("key_facts", []),
        recent_news=report_data.get("recent_news", []),
        connections=report_data.get("connections", []),
        risk_indicators=report_data.get("risk_indicators", []),
        sources=sources,
        report_rid=doc.rid,
        model="cached",
        tokens_used=0,
        created_at=doc.created_at,
    )
