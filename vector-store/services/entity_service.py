"""Entity Service.

Erstellt automatisch Personen- und Unternehmens-Dokumente mit eigenen RIDs
und verknüpft sie mit dem Quelldokument via document_links.
"""

from slugify import slugify

from models.document import DocumentCreate, DocumentLinkCreate
from services.ner_service import ExtractedEntity, extract_entities


def extract_and_link_entities(
    document_rid: str,
    content: str,
    language: str,
    source: str | None,
    create_document_fn,
    create_link_fn,
    get_document_fn,
) -> list[dict]:
    """Extrahiert Entitäten aus dem Inhalt, erstellt sie als Dokumente und verlinkt sie.

    Args:
        document_rid: RID des Quelldokuments
        content: Text zum Durchsuchen
        language: Sprache des Textes
        source: Quellangabe
        create_document_fn: Funktion zum Erstellen von Dokumenten (vermeidet zirkuläre Imports)
        create_link_fn: Funktion zum Erstellen von Links
        get_document_fn: Funktion zum Prüfen ob Dokument existiert

    Returns:
        Liste der erstellten/verlinkten Entitäten mit Status
    """
    entities = extract_entities(content, language)
    results = []

    for entity in entities:
        entity_rid = _build_entity_rid(entity)

        # Prüfe ob Entität bereits existiert
        existing = get_document_fn(entity_rid)

        if existing is None:
            # Neue Entität als Dokument anlegen
            entity_doc = DocumentCreate(
                doc_type=entity.entity_type,
                title=entity.name,
                content=_build_entity_content(entity),
                metadata={
                    "entity_type": entity.entity_type,
                    "discovered_in": document_rid,
                    "source_context": entity.source_text[:500],
                },
                language=language,
                source=source,
                rid=entity_rid,
            )
            try:
                create_document_fn(entity_doc, extract_entities_flag=False)
                status = "created"
            except Exception as e:
                results.append({
                    "rid": entity_rid,
                    "name": entity.name,
                    "type": entity.entity_type,
                    "status": f"error: {e}",
                })
                continue
        else:
            status = "existing"

        # Verknüpfung erstellen: Dokument --mentions--> Entität
        link = DocumentLinkCreate(
            target_rid=entity_rid,
            link_type="mentions",
            metadata={"context": entity.source_text[:300]},
        )
        try:
            create_link_fn(document_rid, link)
        except Exception:
            pass  # Link existiert möglicherweise bereits (PK constraint)

        results.append({
            "rid": entity_rid,
            "name": entity.name,
            "type": entity.entity_type,
            "status": status,
        })

    return results


def _build_entity_rid(entity: ExtractedEntity) -> str:
    """Generiert eine RID für eine Entität."""
    locator = slugify(entity.name, max_length=80, word_boundary=True)
    return f"ri.svg.{entity.entity_type}.{locator}"


def _build_entity_content(entity: ExtractedEntity) -> str:
    """Erstellt den Dokumentinhalt für eine Entität."""
    type_label = "Person" if entity.entity_type == "person" else "Unternehmen/Organisation"
    return (
        f"{type_label}: {entity.name}\n\n"
        f"Automatisch erkannt aus Dokumententext.\n"
        f"Kontext: {entity.source_text}"
    )
