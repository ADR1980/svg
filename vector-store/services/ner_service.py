"""Named Entity Recognition Service.

Erkennt Personen (PER) und Organisationen/Unternehmen (ORG) in Texten
mittels spaCy. Unterstützt Deutsch und Englisch.
"""

from dataclasses import dataclass
from functools import lru_cache

import spacy


@dataclass(frozen=True)
class ExtractedEntity:
    """Eine erkannte Entität aus dem Text."""

    name: str
    entity_type: str  # "person" oder "company"
    source_text: str  # Originaltext-Stelle


# spaCy Label -> unser Entity-Typ
_LABEL_MAP = {
    # Deutsch (de_core_news_lg)
    "PER": "person",
    "ORG": "company",
    # Englisch (en_core_web_sm) - als Fallback
    "PERSON": "person",
}


@lru_cache(maxsize=2)
def _load_model(model_name: str):
    """Lädt ein spaCy-Modell (gecacht)."""
    return spacy.load(model_name)


def _get_model(language: str):
    """Wählt das passende spaCy-Modell anhand der Sprache."""
    models = {
        "de": "de_core_news_lg",
        "en": "en_core_web_sm",
    }
    model_name = models.get(language, "de_core_news_lg")
    try:
        return _load_model(model_name)
    except OSError:
        # Fallback: kleineres Modell versuchen
        fallbacks = {
            "de_core_news_lg": "de_core_news_md",
            "de_core_news_md": "de_core_news_sm",
        }
        fallback = fallbacks.get(model_name)
        if fallback:
            try:
                return _load_model(fallback)
            except OSError:
                pass
        raise RuntimeError(
            f"Kein spaCy-Modell für Sprache '{language}' gefunden. "
            f"Installiere mit: python -m spacy download {model_name}"
        )


def extract_entities(text: str, language: str = "de") -> list[ExtractedEntity]:
    """Extrahiert Personen und Unternehmen aus einem Text.

    Returns:
        Liste von ExtractedEntity mit deduplizierten Namen.
    """
    nlp = _get_model(language)
    doc = nlp(text)

    seen: dict[str, ExtractedEntity] = {}

    for ent in doc.ents:
        entity_type = _LABEL_MAP.get(ent.label_)
        if entity_type is None:
            continue

        # Normalisierung: Whitespace bereinigen
        name = " ".join(ent.text.split())
        if len(name) < 2:
            continue

        # Deduplizierung per normalisiertem Namen (case-insensitive)
        key = f"{entity_type}:{name.lower()}"
        if key not in seen:
            seen[key] = ExtractedEntity(
                name=name,
                entity_type=entity_type,
                source_text=ent.sent.text.strip() if ent.sent else "",
            )

    return list(seen.values())
