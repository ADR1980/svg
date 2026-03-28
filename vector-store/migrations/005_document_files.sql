-- =============================================================================
-- SVG Vector Store: Migration 005 - Datei-Speicherung
--
-- Speichert Original-Dateien (PDF, XLSX, DOCX) als Base64 in der DB.
-- Ausführen im Supabase SQL Editor NACH 004.
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_files (
    document_rid TEXT PRIMARY KEY REFERENCES documents(rid) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_data TEXT NOT NULL,           -- Base64-encoded file content
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_tenant ON document_files(tenant_id);

-- RLS
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_select_files" ON document_files FOR SELECT USING (true);
CREATE POLICY "allow_insert_files" ON document_files FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_files" ON document_files FOR DELETE USING (true);
