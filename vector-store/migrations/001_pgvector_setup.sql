-- =============================================================================
-- SVG Vector Store: pgvector Migration
-- Palantir-inspirierte Dokumentenspeicherung mit Ontologie-RIDs
--
-- Ausführen im Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- pgvector Extension aktivieren
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- Haupttabelle: Dokumente mit Ontologie-RID
-- =============================================================================
CREATE TABLE IF NOT EXISTS documents (
    rid TEXT PRIMARY KEY,                    -- ri.svg.<type>.<locator>
    doc_type TEXT NOT NULL,                  -- risk-report, project, customer, etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL,                   -- Volltext des Dokuments
    metadata JSONB DEFAULT '{}',            -- Flexible Metadaten
    language TEXT DEFAULT 'de',
    source TEXT,                             -- Ursprungssystem/Datei
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Chunk-Tabelle: Dokument-Teile mit Embeddings
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_rid TEXT NOT NULL REFERENCES documents(rid) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,         -- 384 Dimensionen (all-MiniLM-L6-v2)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Beziehungstabelle: Dokument-Verknüpfungen (Ontologie-Links)
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_links (
    source_rid TEXT NOT NULL REFERENCES documents(rid) ON DELETE CASCADE,
    target_rid TEXT NOT NULL REFERENCES documents(rid) ON DELETE CASCADE,
    link_type TEXT NOT NULL,                 -- relates-to, derived-from, supersedes, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (source_rid, target_rid, link_type)
);

-- =============================================================================
-- Indizes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_rid);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- Automatisches updated_at bei Änderungen
-- =============================================================================
CREATE OR REPLACE FUNCTION update_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_timestamp();

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read documents" ON documents
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert documents" ON documents
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update documents" ON documents
    FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete documents" ON documents
    FOR DELETE USING (true);

CREATE POLICY "Allow public read chunks" ON document_chunks
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert chunks" ON document_chunks
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete chunks" ON document_chunks
    FOR DELETE USING (true);

CREATE POLICY "Allow public read links" ON document_links
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert links" ON document_links
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete links" ON document_links
    FOR DELETE USING (true);

-- =============================================================================
-- Semantische Suchfunktion
-- =============================================================================
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    document_rid TEXT,
    chunk_text TEXT,
    similarity FLOAT,
    doc_type TEXT,
    title TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.document_rid,
        dc.chunk_text,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        d.doc_type,
        d.title,
        d.metadata
    FROM document_chunks dc
    JOIN documents d ON d.rid = dc.document_rid
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
      AND (filter_type IS NULL OR d.doc_type = filter_type)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
