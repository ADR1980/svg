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
from models.exceptions import SpamRejectedError, DuplicateDocumentError
from models.tenant import TenantContext
from services.rid_service import generate_rid, validate_doc_type
from services.embedding_service import generate_embedding, generate_embeddings
from services.chunking_service import chunk_text
from services.entity_service import extract_and_link_entities
from services.spam_filter_service import check_spam
from services.dedup_service import (
    compute_content_hash,
    check_exact_duplicate,
    check_rid_duplicate,
    check_near_duplicate,
)


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ─── Document CRUD ────────────────────────────────────────────────────────────


def create_document(
    doc: DocumentCreate,
    tenant: TenantContext,
    extract_entities_flag: bool = True,
    skip_checks: bool = False,
) -> DocumentResponse:
    """Erstellt ein Dokument mit Chunks und Embeddings.

    Args:
        doc: Dokument-Daten
        tenant: Tenant-Kontext (bestimmt tenant_id und RID-Namespace)
        extract_entities_flag: Wenn True, werden Personen und Unternehmen
            automatisch extrahiert, als eigene Dokumente angelegt und verlinkt.
        skip_checks: Wenn True, werden Spam- und Dedup-Checks übersprungen.

    Raises:
        SpamRejectedError: Dokument wurde als Spam erkannt.
        DuplicateDocumentError: Dokument existiert bereits.
    """
    client = _get_client()
    tenant_id = tenant.tenant_id

    validate_doc_type(doc.doc_type, tenant_id=tenant_id)

    # ── 1. Spam-Check ────────────────────────────────────────────────────────
    if not skip_checks:
        spam_result = check_spam(doc.content, doc.title, doc.metadata, doc.doc_type)
        if spam_result.is_spam:
            raise SpamRejectedError(spam_result.reason, spam_result.score)

    # ── 2. Content-Hash berechnen ────────────────────────────────────────────
    content_hash = compute_content_hash(doc.content)

    # ── 3. Exakte Deduplizierung (per-Tenant) ────────────────────────────────
    if not skip_checks:
        exact = check_exact_duplicate(doc.doc_type, content_hash, tenant_id=tenant_id)
        if exact.is_duplicate:
            raise DuplicateDocumentError("exact", exact.existing_rid, exact.similarity)

    # ── 4. RID generieren (mit Tenant-Namespace) ────────────────────────────
    rid = doc.rid if doc.rid else generate_rid(doc.doc_type, doc.title, tenant_id=tenant_id)
    rid_dup = check_rid_duplicate(rid)
    if rid_dup.is_duplicate:
        raise DuplicateDocumentError("rid", rid)

    # ── 5. Near-Duplicate-Check (per-Tenant) ─────────────────────────────────
    if not skip_checks:
        near = check_near_duplicate(doc.content, doc.doc_type, tenant_ids=[tenant_id])
        if near.is_duplicate:
            raise DuplicateDocumentError("near", near.existing_rid, near.similarity)

    # ── 6. Dokument speichern ────────────────────────────────────────────────
    doc_data = {
        "rid": rid,
        "tenant_id": tenant_id,
        "doc_type": doc.doc_type,
        "title": doc.title,
        "content": doc.content,
        "content_hash": content_hash,
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
                "tenant_id": tenant_id,
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
            create_document_fn=lambda d, **kw: create_document(d, tenant=tenant, **kw),
            create_link_fn=lambda src, lnk: create_link(src, lnk, tenant=tenant),
            get_document_fn=lambda r: get_document(r, tenant=tenant),
        )
        if entity_results:
            updated_metadata = {**doc.metadata, "extracted_entities": entity_results}
            client.table("documents").update({"metadata": updated_metadata}).eq("rid", rid).execute()
            document["metadata"] = updated_metadata

    return DocumentResponse(**document)


def get_document(rid: str, tenant: TenantContext | None = None) -> DocumentResponse | None:
    """Ruft ein Dokument per RID ab (tenant-scoped)."""
    client = _get_client()
    query = client.table("documents").select("*").eq("rid", rid)
    if tenant:
        query = query.in_("tenant_id", tenant.visible_tenant_ids)
    result = query.execute()
    if not result.data:
        return None
    return DocumentResponse(**result.data[0])


def list_documents(
    tenant: TenantContext,
    doc_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[DocumentResponse]:
    """Listet Dokumente, tenant-scoped und optional nach Typ gefiltert."""
    client = _get_client()
    query = client.table("documents").select("*").in_("tenant_id", tenant.visible_tenant_ids)
    if doc_type:
        query = query.eq("doc_type", doc_type)
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return [DocumentResponse(**d) for d in result.data]


def delete_document(rid: str, tenant: TenantContext) -> bool:
    """Löscht ein Dokument (nur eigener Tenant, CASCADE löscht Chunks)."""
    client = _get_client()
    result = (
        client.table("documents")
        .delete()
        .eq("rid", rid)
        .eq("tenant_id", tenant.tenant_id)
        .execute()
    )
    return len(result.data) > 0


# ─── Semantische Suche ────────────────────────────────────────────────────────


def search_documents(query: SearchQuery, tenant: TenantContext) -> list[SearchResult]:
    """Führt eine tenant-scoped semantische Suche durch."""
    client = _get_client()

    query_embedding = generate_embedding(query.query)

    result = client.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_threshold": query.threshold,
            "match_count": query.limit,
            "filter_type": query.doc_type,
            "tenant_ids": tenant.visible_tenant_ids,
        },
    ).execute()

    return [SearchResult(**r) for r in result.data]


# ─── Dokument-Links (Ontologie) ──────────────────────────────────────────────


def create_link(source_rid: str, link: DocumentLinkCreate, tenant: TenantContext) -> DocumentLinkResponse:
    """Erstellt eine Verknüpfung zwischen zwei Dokumenten."""
    client = _get_client()
    link_data = {
        "source_rid": source_rid,
        "target_rid": link.target_rid,
        "link_type": link.link_type,
        "metadata": link.metadata,
        "tenant_id": tenant.tenant_id,
    }
    result = client.table("document_links").insert(link_data).execute()
    return DocumentLinkResponse(**result.data[0])


def get_links(rid: str, tenant: TenantContext) -> list[DocumentLinkResponse]:
    """Gibt alle tenant-scoped Verknüpfungen eines Dokuments zurück."""
    client = _get_client()

    outgoing = (
        client.table("document_links")
        .select("*")
        .eq("source_rid", rid)
        .in_("tenant_id", tenant.visible_tenant_ids)
        .execute()
    )
    incoming = (
        client.table("document_links")
        .select("*")
        .eq("target_rid", rid)
        .in_("tenant_id", tenant.visible_tenant_ids)
        .execute()
    )

    links = outgoing.data + incoming.data
    return [DocumentLinkResponse(**l) for l in links]
