-- BUG FIX: Add missing base_id to incident_reports
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS base_id UUID REFERENCES bases(id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_base_id ON incident_reports(base_id);
