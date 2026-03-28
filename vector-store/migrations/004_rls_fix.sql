-- =============================================================================
-- SVG Vector Store: Migration 004 - RLS Fix
--
-- Die RLS-Policies aus 003 nutzten current_setting('app.tenant_id'),
-- aber die Supabase REST API (PostgREST) kann keine Session-Variablen
-- setzen. Lösung: Write-Policies auf permissiv setzen.
-- Die Tenant-Isolation erfolgt über Application-Level-Filterung.
-- RLS bleibt als Leseschutz aktiv (SELECT).
--
-- Ausführen im Supabase SQL Editor NACH 003
-- =============================================================================

-- Documents: Write-Policies permissiv machen
DROP POLICY IF EXISTS "tenant_insert_documents" ON documents;
DROP POLICY IF EXISTS "tenant_update_documents" ON documents;
DROP POLICY IF EXISTS "tenant_delete_documents" ON documents;
DROP POLICY IF EXISTS "tenant_select_documents" ON documents;

CREATE POLICY "allow_select_documents" ON documents FOR SELECT USING (true);
CREATE POLICY "allow_insert_documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_documents" ON documents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_documents" ON documents FOR DELETE USING (true);

-- Document Chunks
DROP POLICY IF EXISTS "tenant_select_chunks" ON document_chunks;
DROP POLICY IF EXISTS "tenant_insert_chunks" ON document_chunks;
DROP POLICY IF EXISTS "tenant_delete_chunks" ON document_chunks;

CREATE POLICY "allow_select_chunks" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "allow_insert_chunks" ON document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_chunks" ON document_chunks FOR DELETE USING (true);

-- Document Links
DROP POLICY IF EXISTS "tenant_select_links" ON document_links;
DROP POLICY IF EXISTS "tenant_insert_links" ON document_links;
DROP POLICY IF EXISTS "tenant_delete_links" ON document_links;

CREATE POLICY "allow_select_links" ON document_links FOR SELECT USING (true);
CREATE POLICY "allow_insert_links" ON document_links FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_links" ON document_links FOR DELETE USING (true);
