-- =============================================================================
-- SVG Vector Store: Migration 006 - Konfigurierbare Dokumenttypen
--
-- Dokumenttypen werden pro Tenant in der DB verwaltet statt hartkodiert.
-- System-Typen (person, company, email, intelligence) sind geschützt.
--
-- Ausführen im Supabase SQL Editor NACH 005.
-- =============================================================================

CREATE TABLE IF NOT EXISTS doc_types (
    id TEXT NOT NULL,                         -- Slug: "risk-report", "invoice", etc.
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    label TEXT NOT NULL,                      -- Anzeigename: "Risiko-Bericht", "Rechnung"
    color TEXT DEFAULT '#6b7280',             -- Badge-Farbe (Hex)
    icon TEXT DEFAULT '',                     -- Optionales Icon/Emoji
    is_system BOOLEAN NOT NULL DEFAULT false, -- System-Typen können nicht gelöscht werden
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_types_tenant ON doc_types(tenant_id);

-- RLS
ALTER TABLE doc_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_select_doc_types" ON doc_types FOR SELECT USING (true);
CREATE POLICY "allow_insert_doc_types" ON doc_types FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_doc_types" ON doc_types FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_doc_types" ON doc_types FOR DELETE USING (true);

-- Standard-Dokumenttypen für alle bestehenden Tenants einfügen
INSERT INTO doc_types (id, tenant_id, label, color, icon, is_system, sort_order)
SELECT dt.id, t.id, dt.label, dt.color, dt.icon, dt.is_system, dt.sort_order
FROM tenants t
CROSS JOIN (VALUES
    ('risk-report',  'Risiko-Bericht',  '#ef4444', '',  false, 1),
    ('intelligence', 'Intelligence',     '#06b6d4', '',  false, 2),
    ('project',      'Projekt',          '#3b82f6', '',  false, 3),
    ('customer',     'Kunde',            '#22c55e', '',  false, 4),
    ('product',      'Produkt',          '#8b5cf6', '',  false, 5),
    ('order',        'Auftrag',          '#14b8a6', '',  false, 6),
    ('work-step',    'Arbeitsschritt',   '#f97316', '',  false, 7),
    ('employee',     'Mitarbeiter',      '#ec4899', '',  false, 8),
    ('machine',      'Maschine',         '#64748b', '',  false, 9),
    ('person',       'Person',           '#a855f7', '',  true,  90),
    ('company',      'Unternehmen',      '#f59e0b', '',  true,  91),
    ('email',        'E-Mail',           '#38bdf8', '',  true,  92)
) AS dt(id, label, color, icon, is_system, sort_order)
ON CONFLICT (id, tenant_id) DO NOTHING;
