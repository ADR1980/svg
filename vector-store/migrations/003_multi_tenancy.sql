-- =============================================================================
-- SVG Vector Store: Multi-Tenancy Migration
-- Fügt Mandantenfähigkeit mit Parent-Child-Hierarchie hinzu
--
-- Ausführen im Supabase SQL Editor NACH 001 und 002
-- =============================================================================

-- =============================================================================
-- 1. Tenant-Tabelle
-- =============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,                    -- Slug: "acme-corp", "svg-global"
    name TEXT NOT NULL,                     -- Anzeigename
    parent_tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
    api_key_hash TEXT UNIQUE,               -- SHA-256 Hash des API-Keys
    config JSONB DEFAULT '{}',              -- Per-Tenant Config (IMAP, Graph, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_parent ON tenants(parent_tenant_id);

-- =============================================================================
-- 2. Users-Tabelle (JWT-Login)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',     -- 'admin', 'member', 'viewer'
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================================
-- 3. Default-Tenant anlegen (für bestehende Daten)
-- =============================================================================
INSERT INTO tenants (id, name) VALUES ('svg', 'SVG Global')
    ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. tenant_id zu bestehenden Tabellen hinzufügen
-- =============================================================================

-- documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
UPDATE documents SET tenant_id = 'svg' WHERE tenant_id IS NULL;
ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;

-- document_chunks
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
UPDATE document_chunks SET tenant_id = 'svg' WHERE tenant_id IS NULL;
ALTER TABLE document_chunks ALTER COLUMN tenant_id SET NOT NULL;

-- document_links
ALTER TABLE document_links ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
UPDATE document_links SET tenant_id = 'svg' WHERE tenant_id IS NULL;
ALTER TABLE document_links ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================================================
-- 5. Indizes für Tenant-Filterung
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chunks_tenant ON document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_links_tenant ON document_links(tenant_id);

-- Dedup-Index: per-Tenant + doc_type + content_hash
DROP INDEX IF EXISTS idx_documents_content_dedup;
CREATE UNIQUE INDEX idx_documents_content_dedup
    ON documents(tenant_id, doc_type, content_hash);

-- =============================================================================
-- 6. RLS Policies neu: tenant-scoped
-- =============================================================================

-- Alte Policies entfernen
DROP POLICY IF EXISTS "Allow public read documents" ON documents;
DROP POLICY IF EXISTS "Allow public insert documents" ON documents;
DROP POLICY IF EXISTS "Allow public update documents" ON documents;
DROP POLICY IF EXISTS "Allow public delete documents" ON documents;

DROP POLICY IF EXISTS "Allow public read chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow public insert chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow public delete chunks" ON document_chunks;

DROP POLICY IF EXISTS "Allow public read links" ON document_links;
DROP POLICY IF EXISTS "Allow public insert links" ON document_links;
DROP POLICY IF EXISTS "Allow public delete links" ON document_links;

-- Neue tenant-scoped Policies (Application-Level + RLS Safety Net)
-- app.tenant_id und app.visible_tenants werden per-Request via SET gesetzt

CREATE POLICY "tenant_select_documents" ON documents
    FOR SELECT USING (
        current_setting('app.visible_tenants', true) LIKE '%' || tenant_id || '%'
    );
CREATE POLICY "tenant_insert_documents" ON documents
    FOR INSERT WITH CHECK (
        tenant_id = current_setting('app.tenant_id', true)
    );
CREATE POLICY "tenant_update_documents" ON documents
    FOR UPDATE USING (
        tenant_id = current_setting('app.tenant_id', true)
    );
CREATE POLICY "tenant_delete_documents" ON documents
    FOR DELETE USING (
        tenant_id = current_setting('app.tenant_id', true)
    );

CREATE POLICY "tenant_select_chunks" ON document_chunks
    FOR SELECT USING (
        current_setting('app.visible_tenants', true) LIKE '%' || tenant_id || '%'
    );
CREATE POLICY "tenant_insert_chunks" ON document_chunks
    FOR INSERT WITH CHECK (
        tenant_id = current_setting('app.tenant_id', true)
    );
CREATE POLICY "tenant_delete_chunks" ON document_chunks
    FOR DELETE USING (
        tenant_id = current_setting('app.tenant_id', true)
    );

CREATE POLICY "tenant_select_links" ON document_links
    FOR SELECT USING (
        current_setting('app.visible_tenants', true) LIKE '%' || tenant_id || '%'
    );
CREATE POLICY "tenant_insert_links" ON document_links
    FOR INSERT WITH CHECK (
        tenant_id = current_setting('app.tenant_id', true)
    );
CREATE POLICY "tenant_delete_links" ON document_links
    FOR DELETE USING (
        tenant_id = current_setting('app.tenant_id', true)
    );

-- Tenants und Users: öffentlich lesbar (für Auth-Middleware), nur Admin kann schreiben
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_tenants" ON tenants FOR SELECT USING (true);
CREATE POLICY "public_write_tenants" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_tenants" ON tenants FOR UPDATE USING (true);

CREATE POLICY "public_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "public_write_users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_users" ON users FOR UPDATE USING (true);

-- =============================================================================
-- 7. match_documents RPC: tenant_ids Parameter
-- =============================================================================
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_type TEXT DEFAULT NULL,
    tenant_ids TEXT[] DEFAULT NULL
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
      AND (tenant_ids IS NULL OR d.tenant_id = ANY(tenant_ids))
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
