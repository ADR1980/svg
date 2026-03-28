"""Entity-Linker Service.

Ordnet Personen automatisch Unternehmen zu, wenn sie im selben Kontext
(gleicher Satz) erkannt wurden. Erkennt auch Rollenbezeichnungen wie
CEO, Vorstand, Geschäftsführer, etc.
"""

import logging
import re

from models.document import DocumentLinkCreate
from services.ner_service import ExtractedEntity

logger = logging.getLogger(__name__)

# Rollenbezeichnungen die eine Zugehörigkeit implizieren
ROLE_PATTERNS = [
    # Deutsch
    r"(?:CEO|CFO|CTO|COO|CIO)\b",
    r"\b(?:Vorstand|Vorstandsvorsitzende[r]?|Aufsichtsrat|Geschäftsführer(?:in)?)\b",
    r"\b(?:Leiter(?:in)?|Direktor(?:in)?|Chef(?:in)?|Präsident(?:in)?)\b",
    r"\b(?:Gründer(?:in)?|Inhaber(?:in)?|Partner(?:in)?|Sprecher(?:in)?)\b",
    r"\b(?:Minister(?:in)?|Staatssekretär(?:in)?|Generalsekretär(?:in)?|General)\b",
    r"\b(?:Vorsitzende[r]?|Beauftragter?|Kommandeur)\b",
    # Englisch
    r"\b(?:Chairman|President|Director|Head|Manager|Founder|Secretary)\b",
]

ROLE_REGEX = re.compile("|".join(ROLE_PATTERNS), re.IGNORECASE)


def find_person_company_links(
    entities: list[ExtractedEntity],
) -> list[tuple[ExtractedEntity, ExtractedEntity, str]]:
    """Findet Person-Unternehmen-Zuordnungen basierend auf Co-Occurrence.

    Analysiert ob Personen und Unternehmen im gleichen Satz vorkommen
    und leitet daraus eine Zugehörigkeit ab.

    Returns:
        Liste von (person, company, relationship_type) Tupeln.
    """
    persons = [e for e in entities if e.entity_type == "person"]
    companies = [e for e in entities if e.entity_type == "company"]

    if not persons or not companies:
        return []

    links = []

    for person in persons:
        person_sent = person.source_text.lower()
        if not person_sent:
            continue

        for company in companies:
            # Prüfe ob Person und Unternehmen im gleichen Satz stehen
            if company.name.lower() not in person_sent:
                # Auch umgekehrt prüfen: Person im Satz des Unternehmens
                if person.name.lower() not in company.source_text.lower():
                    continue

            # Zuordnung gefunden! Beziehungstyp bestimmen
            context = person.source_text
            rel_type = _determine_relationship(person.name, company.name, context)
            links.append((person, company, rel_type))

    return links


def _determine_relationship(person_name: str, company_name: str, context: str) -> str:
    """Bestimmt den Beziehungstyp aus dem Kontext."""
    # Suche nach Rollenbezeichnungen im Kontext
    match = ROLE_REGEX.search(context)
    if match:
        role = match.group(0)
        # Spezifische Beziehungstypen
        role_lower = role.lower()
        if role_lower in ("ceo", "vorstandsvorsitzender", "vorstandsvorsitzende", "geschäftsführer", "geschäftsführerin"):
            return "leads"
        if role_lower in ("gründer", "gründerin", "founder", "inhaber", "inhaberin"):
            return "founded"
        if role_lower in ("minister", "ministerin", "staatssekretär", "staatssekretärin"):
            return "leads"
        return "works-for"

    # Fallback: generische Zuordnung
    return "affiliated-with"


def auto_link_entities(
    entities: list[ExtractedEntity],
    namespace: str,
    create_link_fn,
) -> list[dict]:
    """Erstellt automatisch Person-Unternehmen-Links basierend auf Co-Occurrence.

    Args:
        entities: Liste aller extrahierten Entitäten
        namespace: Tenant-Namespace für RID-Generierung
        create_link_fn: Funktion zum Erstellen von Links

    Returns:
        Liste von {person, company, relationship, status} Dicts
    """
    from slugify import slugify

    links_found = find_person_company_links(entities)
    results = []

    for person, company, rel_type in links_found:
        person_rid = f"ri.{namespace}.person.{slugify(person.name, max_length=80, word_boundary=True)}"
        company_rid = f"ri.{namespace}.company.{slugify(company.name, max_length=80, word_boundary=True)}"

        link = DocumentLinkCreate(
            target_rid=company_rid,
            link_type=rel_type,
            metadata={
                "auto_detected": True,
                "context": person.source_text[:300],
            },
        )
        try:
            create_link_fn(person_rid, link)
            status = "linked"
            logger.info("Auto-Link: %s --%s--> %s", person.name, rel_type, company.name)
        except Exception:
            status = "exists"  # Link existiert wahrscheinlich bereits

        results.append({
            "person": person.name,
            "person_rid": person_rid,
            "company": company.name,
            "company_rid": company_rid,
            "relationship": rel_type,
            "status": status,
        })

    return results
