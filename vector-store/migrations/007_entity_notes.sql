-- =============================================================================
-- SVG Vector Store: Migration 007 - Entity-Notizen
--
-- Notizen für Personen und Unternehmen.
-- Ausführen im Supabase SQL Editor NACH 006.
-- =============================================================================

CREATE TABLE IF NOT EXISTS entity_notes (
    id SERIAL PRIMARY KEY,
    entity_rid TEXT NOT NULL REFERENCES documents(rid) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author TEXT,                               -- Email/Name des Autors
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_notes_rid ON entity_notes(entity_rid);
CREATE INDEX IF NOT EXISTS idx_entity_notes_tenant ON entity_notes(tenant_id);

-- Auto-Update Timestamp
CREATE TRIGGER entity_notes_updated_at
    BEFORE UPDATE ON entity_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_timestamp();

-- RLS
ALTER TABLE entity_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_select_notes" ON entity_notes FOR SELECT USING (true);
CREATE POLICY "allow_insert_notes" ON entity_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_notes" ON entity_notes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_notes" ON entity_notes FOR DELETE USING (true);
