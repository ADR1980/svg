-- Supabase Migration für ATC Produktionsplaner
-- Dieses Skript im Supabase SQL Editor ausführen (Dashboard > SQL Editor)

-- Key-Value Tabelle für App-Daten (spiegelt localStorage)
CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatisches updated_at bei Änderungen
CREATE OR REPLACE FUNCTION update_app_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_data_updated_at
  BEFORE UPDATE ON app_data
  FOR EACH ROW
  EXECUTE FUNCTION update_app_data_timestamp();

-- Row Level Security: Öffentlicher Zugriff mit anon key erlauben
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON app_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON app_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON app_data
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete" ON app_data
  FOR DELETE USING (true);

-- Index für schnelle Key-Suche
CREATE INDEX IF NOT EXISTS idx_app_data_key ON app_data (key);
