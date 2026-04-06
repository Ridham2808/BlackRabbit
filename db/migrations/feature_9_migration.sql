-- ============================================================
-- FEATURE 9: ADVANCED INCIDENT REPORTING & INVESTIGATION
-- Database Migration Script
-- ============================================================

-- 1. Create Sequence for Incident Numbers
CREATE SEQUENCE IF NOT EXISTS incident_number_seq START 1;

-- 2. Update checkout_records.status CHECK constraint
-- PostgreSQL does not allow direct ALTER of CHECK constraints, we must drop and recreate
ALTER TABLE checkout_records DROP CONSTRAINT IF EXISTS chk_checkout_status;
ALTER TABLE checkout_records ADD CONSTRAINT chk_checkout_status CHECK (
  status IN ('ACTIVE','RETURNED','OVERDUE','LOST','ESCALATED','CUSTODY_SUSPENDED_INCIDENT_FILED')
);

-- 3. Add accountability_score to personnel
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS accountability_score INT DEFAULT 100;

-- 4. Create New Tables

-- Table: incident_witness_statements
CREATE TABLE IF NOT EXISTS incident_witness_statements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  witness_personnel_id  UUID NOT NULL REFERENCES personnel(id),
  statement_text        TEXT NOT NULL,
  statement_signature_data TEXT NOT NULL, -- base64 PNG
  confirmed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  witness_latitude      DECIMAL(10,8),
  witness_longitude     DECIMAL(11,8),
  is_disputed           BOOLEAN DEFAULT false,
  dispute_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_witness_statement_len CHECK (length(statement_text) >= 50),
  UNIQUE (incident_id, witness_personnel_id) -- Only one statement per witness per incident
);

-- Table: incident_equipment_links (For Multi-Asset Incidents)
CREATE TABLE IF NOT EXISTS incident_equipment_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  equipment_id          UUID NOT NULL REFERENCES equipment(id),
  equipment_serial      VARCHAR(50) NOT NULL,
  equipment_name        VARCHAR(150) NOT NULL,
  equipment_status_before VARCHAR(30),
  flagged_at            TIMESTAMPTZ DEFAULT NOW(),
  resolution_status     VARCHAR(30),
  resolved_at           TIMESTAMPTZ,
  resolution_notes      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: accountability_score_events
CREATE TABLE IF NOT EXISTS accountability_score_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id          UUID NOT NULL REFERENCES personnel(id),
  incident_id           UUID REFERENCES incident_reports(id),
  event_type            VARCHAR(30) NOT NULL, -- DEDUCTION, RESTORATION, MANUAL_ADJUSTMENT
  points_changed        INT NOT NULL,
  reason                TEXT,
  performed_by          UUID REFERENCES personnel(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_score_event_type CHECK (event_type IN ('DEDUCTION','RESTORATION','MANUAL_ADJUSTMENT'))
);

-- 5. Update incident_reports columns
-- Flat columns for CO signature
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS co_acknowledged_by UUID REFERENCES personnel(id);
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS co_acknowledged_at TIMESTAMPTZ;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS co_signature_data TEXT; -- base64 signature
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS co_acknowledgment_required BOOLEAN DEFAULT false;

-- Evidence integrity JSONB (array of objects)
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS evidence_integrity JSONB DEFAULT '[]'::jsonb;

-- Investigation trail JSONB (array of logs)
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS investigation_trail JSONB DEFAULT '[]'::jsonb;

-- 6. Trigger for Investigation Trail Immutability
CREATE OR REPLACE FUNCTION check_investigation_trail_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- We allow appending to the array, but NOT removing or modifying existing elements.
  -- Compare old and new JSONB lengths: new length must be >= old length,
  -- and old elements must be a subset of new elements (JSONB @> operator).
  IF OLD.investigation_trail IS NOT NULL THEN
    IF NOT (NEW.investigation_trail @> OLD.investigation_trail) THEN
      RAISE EXCEPTION 'Investigation trail is immutable. Existing entries cannot be modified or removed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_investigation_trail_immutability ON incident_reports;
CREATE TRIGGER trg_investigation_trail_immutability
  BEFORE UPDATE OF investigation_trail ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION check_investigation_trail_immutability();

-- 7. Indices for Performance
CREATE INDEX IF NOT EXISTS idx_witness_incident_id ON incident_witness_statements(incident_id);
CREATE INDEX IF NOT EXISTS idx_equip_link_incident_id ON incident_equipment_links(incident_id);
CREATE INDEX IF NOT EXISTS idx_score_events_personnel_id ON accountability_score_events(personnel_id);
