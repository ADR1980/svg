from supabase import create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY
from models.document import (
    DocumentCreate,
    DocumentResponse,
    SearchQuery,
    SearchResult,
    DocumentLinkCreate,
    DocumentLinkResponse,
)
from services.rid_service import generate_rid, validate_doc_type
from services.embedding_service import generate_embedding, generate_embeddings
from services.chunking_service import chunk_text
from services.entity_service import extract_and_link_entities


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ─── Document CRUD ────────────────────────────────────────────────────────────


def create_document(doc: DocumentCreate, extract_entities_flag: bool = True) -> DocumentResponse:
    """Erstellt ein Dokument mit Chunks und Embeddings.

    Args:
        doc: Dokument-Daten
        extract_entities_flag: Wenn True, werden Personen und Unternehmen
            automatisch extrahiert, als eigene Dokumente angelegt und verlinkt.
    """
    client = _get_client()

    validate_doc_type(doc.doc_type)

    # RID generieren oder verwenden
    rid = doc.rid if doc.rid else generate_rid(doc.doc_type, doc.title)

    # Dokument speichern
    doc_data = {
        "rid": rid,
        "doc_type": doc.doc_type,
        "title": doc.title,
        "content": doc.content,
        "metadata": doc.metadata,
        "language": doc.language,
        "source": doc.source,
    }
    result = client.table("documents").insert(doc_data).execute()
    document = result.data[0]

    # Chunks erstellen und embedden
    chunks = chunk_text(doc.content)
    if chunks:
        chunk_texts = chunks
        embeddings = generate_embeddings(chunk_texts)

        chunk_records = [
            {
                "document_rid": rid,
                "chunk_index": i,
                "chunk_text": text,
                "embedding": embedding,
            }
            for i, (text, embedding) in enumerate(zip(chunk_texts, embeddings))
        ]
        client.table("document_chunks").insert(chunk_records).execute()

    # Automatische Entity-Extraktion (Personen & Unternehmen)
    if extract_entities_flag and doc.doc_type not in ("person", "company"):
        entity_results = extract_and_link_entities(
            document_rid=rid,
            content=doc.content,
            language=doc.language,
            source=doc.source,
            create_document_fn=create_document,
            create_link_fn=create_link,
            get_document_fn=get_document,
        )
        # Entitäten-Info in Metadaten speichern
        if entity_results:
            updated_metadata = {**doc.metadata, "extracted_entities": entity_results}
            client.table("documents").update({"metadata": updated_metadata}).eq("rid", rid).execute()
            document["metadata"] = updated_metadata

    return DocumentResponse(**document)


def get_document(rid: str) -> DocumentResponse | None:
    """Ruft ein Dokument per RID ab."""
    client = _get_client()
    result = client.table("documents").select("*").eq("rid", rid).execute()
    if not result.data:
        return None
    return DocumentResponse(**result.data[0])


def list_documents(doc_type: str | None = None, limit: int = 50, offset: int = 0) -> list[DocumentResponse]:
    """Listet Dokumente, optional nach Typ gefiltert."""
    client = _get_client()
    query = client.table("documents").select("*")
    if doc_type:
        query = query.eq("doc_type", doc_type)
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return [DocumentResponse(**d) for d in result.data]


def delete_document(rid: str) -> bool:
    """Löscht ein Dokument und alle zugehörigen Chunks (CASCADE)."""
    client = _get_client()
    result = client.table("documents").delete().eq("rid", rid).execute()
    return len(result.data) > 0


# ─── Semantische Suche ────────────────────────────────────────────────────────


def search_documents(query: SearchQuery) -> list[SearchResult]:
    """Führt eine semantische Suche über alle Dokument-Chunks durch."""
    client = _get_client()

    query_embedding = generate_embedding(query.query)

    result = client.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_threshold": query.threshold,
            "match_count": query.limit,
            "filter_type": query.doc_type,
        },
    ).execute()

    return [SearchResult(**r) for r in result.data]


# ─── Dokument-Links (Ontologie) ──────────────────────────────────────────────


def create_link(source_rid: str, link: DocumentLinkCreate) -> DocumentLinkResponse:
    """Erstellt eine Verknüpfung zwischen zwei Dokumenten."""
    client = _get_client()
    link_data = {
        "source_rid": source_rid,
        "target_rid": link.target_rid,
        "link_type": link.link_type,
        "metadata": link.metadata,
    }
    result = client.table("document_links").insert(link_data).execute()
    return DocumentLinkResponse(**result.data[0])


def get_links(rid: str) -> list[DocumentLinkResponse]:
    """Gibt alle Verknüpfungen eines Dokuments zurück (ein- und ausgehend)."""
    client = _get_client()

    outgoing = (
        client.table("document_links").select("*").eq("source_rid", rid).execute()
    )
    incoming = (
        client.table("document_links").select("*").eq("target_rid", rid).execute()
    )

    links = outgoing.data + incoming.data
    return [DocumentLinkResponse(**l) for l in links]
