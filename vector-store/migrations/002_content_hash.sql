-- =============================================================================
-- SVG Vector Store: Migration 002 - Content-Hash für Deduplizierung
--
-- Ausführen im Supabase SQL Editor (Dashboard > SQL Editor)
-- NACH 001_pgvector_setup.sql
-- =============================================================================

-- Content-Hash Spalte hinzufügen
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Unique Index: gleicher Inhalt im selben Dokumenttyp = Duplikat
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_content_dedup
    ON documents (doc_type, content_hash);

-- Bestehende Dokumente: Hash nachberechnen
UPDATE documents
SET content_hash = encode(sha256(content::bytea), 'hex')
WHERE content_hash IS NULL;
