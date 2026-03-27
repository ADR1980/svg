from config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """Teilt einen Text in überlappende Chunks auf.

    Bevorzugt natürliche Absatzgrenzen (Doppel-Newline), fällt
    auf Satz- bzw. Zeichengrenzen zurück.
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # Kurze Texte brauchen kein Chunking
    if len(text) <= chunk_size:
        return [text]

    # Versuche zuerst Absatz-basiertes Chunking
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if len(paragraphs) > 1:
        chunks = _merge_paragraphs(paragraphs, chunk_size)
        if len(chunks) > 1:
            return chunks

    # Fallback: Zeichenbasiertes Chunking mit Überlappung
    return _sliding_window(text, chunk_size, overlap)


def _merge_paragraphs(paragraphs: list[str], max_size: int) -> list[str]:
    """Fasst Absätze zu Chunks zusammen, ohne max_size zu überschreiten."""
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        candidate = f"{current}\n\n{para}".strip() if current else para
        if len(candidate) <= max_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            # Absatz selbst zu lang -> sliding window
            if len(para) > max_size:
                chunks.extend(_sliding_window(para, max_size, CHUNK_OVERLAP))
                current = ""
            else:
                current = para

    if current:
        chunks.append(current)

    return chunks


def _sliding_window(text: str, size: int, overlap: int) -> list[str]:
    """Zeichenbasiertes Sliding-Window-Chunking."""
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += size - overlap
    return chunks
