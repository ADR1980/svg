from functools import lru_cache

from sentence_transformers import SentenceTransformer

from config import EMBEDDING_MODEL, EMBEDDING_DIMENSIONS


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """Lädt das Embedding-Modell (Singleton via Cache)."""
    return SentenceTransformer(EMBEDDING_MODEL)


def generate_embedding(text: str) -> list[float]:
    """Generiert einen Embedding-Vektor für einen Text."""
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generiert Embedding-Vektoren für mehrere Texte (Batch)."""
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [e.tolist() for e in embeddings]


def get_dimensions() -> int:
    """Gibt die Dimensionsanzahl des aktuellen Modells zurück."""
    return EMBEDDING_DIMENSIONS
