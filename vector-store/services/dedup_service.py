"""Deduplizierungs-Service.

Zwei Prüfebenen:
1. Exakte Duplikate: SHA-256 Content-Hash (O(1) via DB-Index)
2. Near-Duplicates: Embedding Cosine Similarity > 0.95
"""

import hashlib
from dataclasses import dataclass

from supabase import create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY

NEAR_DUPLICATE_THRESHOLD = 0.95


@dataclass
class DedupResult:
    """Ergebnis der Deduplizierungsprüfung."""
    is_duplicate: bool
    duplicate_type: str | None  # "exact", "near", "rid"
    existing_rid: str | None
    similarity: float | None  # Nur bei near-duplicate


def _get_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def compute_content_hash(content: str) -> str:
    """Berechnet den SHA-256 Hash des normalisierten Contents."""
    # Normalisierung: Whitespace vereinheitlichen
    normalized = " ".join(content.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def check_exact_duplicate(doc_type: str, content_hash: str, tenant_id: str | None = None) -> DedupResult:
    """Prüft ob exakt gleicher Inhalt im selben Dokumenttyp (und Tenant) existiert."""
    client = _get_client()

    query = client.table("documents").select("rid").eq("doc_type", doc_type).eq("content_hash", content_hash)
    if tenant_id:
        query = query.eq("tenant_id", tenant_id)
    result = query.limit(1).execute()

    if result.data:
        return DedupResult(
            is_duplicate=True,
            duplicate_type="exact",
            existing_rid=result.data[0]["rid"],
            similarity=1.0,
        )

    return DedupResult(is_duplicate=False, duplicate_type=None, existing_rid=None, similarity=None)


def check_rid_duplicate(rid: str) -> DedupResult:
    """Prüft ob eine RID bereits existiert."""
    client = _get_client()

    result = (
        client.table("documents")
        .select("rid")
        .eq("rid", rid)
        .limit(1)
        .execute()
    )

    if result.data:
        return DedupResult(
            is_duplicate=True,
            duplicate_type="rid",
            existing_rid=rid,
            similarity=None,
        )

    return DedupResult(is_duplicate=False, duplicate_type=None, existing_rid=None, similarity=None)


def check_near_duplicate(content: str, doc_type: str | None = None, tenant_ids: list[str] | None = None) -> DedupResult:
    """Prüft ob ein sehr ähnliches Dokument existiert (Cosine Similarity > 0.95).

    Nutzt die bestehende match_documents RPC-Funktion, tenant-scoped.
    """
    from services.embedding_service import generate_embedding

    embedding = generate_embedding(content[:2000])

    client = _get_client()
    result = client.rpc(
        "match_documents",
        {
            "query_embedding": embedding,
            "match_threshold": NEAR_DUPLICATE_THRESHOLD,
            "match_count": 1,
            "filter_type": doc_type,
            "tenant_ids": tenant_ids,
        },
    ).execute()

    if result.data:
        match = result.data[0]
        return DedupResult(
            is_duplicate=True,
            duplicate_type="near",
            existing_rid=match["document_rid"],
            similarity=match["similarity"],
        )

    return DedupResult(is_duplicate=False, duplicate_type=None, existing_rid=None, similarity=None)
