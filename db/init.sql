-- ============================================================
-- DEFENCE EQUIPMENT ACCOUNTABILITY SYSTEM
-- PostgreSQL 16 + pgvector Schema
-- Run order: this file is executed first by Docker init
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- UTILITY: auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE 1: bases
-- (created before personnel so personnel can FK to it)
-- ============================================================
CREATE TABLE bases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(100) NOT NULL,
  code                  VARCHAR(20)  NOT NULL,
  latitude              DECIMAL(10,8) NOT NULL,
  longitude             DECIMAL(11,8) NOT NULL,
  address               TEXT,
  commanding_officer_id UUID,          -- FK added after personnel
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_bases_name  UNIQUE (name),
  CONSTRAINT uq_bases_code  UNIQUE (code)
);

CREATE TRIGGER set_bases_updated_at
  BEFORE UPDATE ON bases
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 2: units
-- ============================================================
CREATE TABLE units (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(100) NOT NULL,
  code                  VARCHAR(20)  NOT NULL,
  base_id               UUID NOT NULL REFERENCES bases(id) ON DELETE RESTRICT,
  commanding_officer_id UUID,          -- FK added after personnel
  description           TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_units_code UNIQUE (code)
);

CREATE INDEX idx_units_base_id   ON units(base_id);
CREATE INDEX idx_units_is_active ON units(is_active);

CREATE TRIGGER set_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 3: personnel
-- ============================================================
CREATE TABLE personnel (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_number        VARCHAR(20)  NOT NULL,
  full_name             VARCHAR(100) NOT NULL,
  email                 VARCHAR(150) NOT NULL,
  phone                 VARCHAR(20),
  password_hash         VARCHAR(255) NOT NULL,
  role                  VARCHAR(30)  NOT NULL,
  rank                  VARCHAR(50)  NOT NULL,
  unit_id               UUID REFERENCES units(id) ON DELETE SET NULL,
  base_id               UUID REFERENCES bases(id) ON DELETE SET NULL,
  clearance_level       INTEGER NOT NULL DEFAULT 1,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  last_login_at         TIMESTAMPTZ,
  failed_login_count    INTEGER NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  avatar_url            VARCHAR(500),
  biometric_token_hash  VARCHAR(500),
  device_token          VARCHAR(500),
  refresh_token_hash    VARCHAR(500),
  created_by            UUID REFERENCES personnel(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_personnel_service_number UNIQUE (service_number),
  CONSTRAINT uq_personnel_email          UNIQUE (email),
  CONSTRAINT chk_personnel_role CHECK (
    role IN ('SOLDIER','OFFICER','QUARTERMASTER','BASE_ADMIN','AUDITOR','TECHNICIAN','SUPER_ADMIN')
  ),
  CONSTRAINT chk_personnel_clearance CHECK (clearance_level BETWEEN 1 AND 5)
);

CREATE INDEX idx_personnel_service_number ON personnel(service_number);
CREATE INDEX idx_personnel_email          ON personnel(email);
CREATE INDEX idx_personnel_role           ON personnel(role);
CREATE INDEX idx_personnel_unit_id        ON personnel(unit_id);
CREATE INDEX idx_personnel_base_id        ON personnel(base_id);
CREATE INDEX idx_personnel_is_active      ON personnel(is_active);

CREATE TRIGGER set_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Now add deferred FKs for commanding officers
ALTER TABLE bases ADD CONSTRAINT fk_bases_commanding_officer
  FOREIGN KEY (commanding_officer_id) REFERENCES personnel(id) ON DELETE SET NULL;

ALTER TABLE units ADD CONSTRAINT fk_units_commanding_officer
  FOREIGN KEY (commanding_officer_id) REFERENCES personnel(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE 4: equipment_categories
-- ============================================================
CREATE TABLE equipment_categories (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      VARCHAR(100) NOT NULL,
  display_name              VARCHAR(100) NOT NULL,
  description               TEXT,
  criticality_level         VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
  maintenance_interval_days INTEGER      NOT NULL DEFAULT 90,
  max_checkout_hours        INTEGER      NOT NULL DEFAULT 24,
  requires_officer_approval BOOLEAN      NOT NULL DEFAULT false,
  icon_name                 VARCHAR(50),
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_equipment_categories_name UNIQUE (name),
  CONSTRAINT chk_cat_criticality CHECK (criticality_level IN ('HIGH','MEDIUM','LOW'))
);

CREATE TRIGGER set_equipment_categories_updated_at
  BEFORE UPDATE ON equipment_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 5: equipment (central)
-- ============================================================
CREATE TABLE equipment (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number             VARCHAR(50)   NOT NULL,
  name                      VARCHAR(150)  NOT NULL,
  category_id               UUID          NOT NULL REFERENCES equipment_categories(id),
  description               TEXT,
  manufacturer              VARCHAR(100),
  model_number              VARCHAR(100),
  purchase_date             DATE,
  purchase_price            DECIMAL(12,2),
  status                    VARCHAR(30)   NOT NULL DEFAULT 'OPERATIONAL',
  condition                 VARCHAR(20)   NOT NULL DEFAULT 'GOOD',
  home_base_id              UUID          NOT NULL REFERENCES bases(id),
  home_unit_id              UUID          REFERENCES units(id),
  current_location_base_id  UUID          REFERENCES bases(id),
  current_custodian_id      UUID          REFERENCES personnel(id) ON DELETE SET NULL,
  current_checkout_id       UUID,         -- FK added after checkout_records
  last_known_latitude       DECIMAL(10,8),
  last_known_longitude      DECIMAL(11,8),
  last_location_update_at   TIMESTAMPTZ,
  total_checkout_count      INTEGER       NOT NULL DEFAULT 0,
  total_usage_hours         DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_maintenance_at       DATE,
  next_maintenance_due      DATE,
  qr_code_url               VARCHAR(500),
  tags                      TEXT[],
  specifications            JSONB,
  images                    TEXT[],
  notes                     TEXT,
  is_deleted                BOOLEAN       NOT NULL DEFAULT false,
  created_by                UUID          REFERENCES personnel(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_equipment_serial_number UNIQUE(serial_number),
  CONSTRAINT chk_equipment_status CHECK (
    status IN ('OPERATIONAL','CHECKED_OUT','UNDER_MAINTENANCE','LOST','MISSING','DECOMMISSIONED','FLAGGED','IN_TRANSIT')
  ),
  CONSTRAINT chk_equipment_condition CHECK (
    condition IN ('EXCELLENT','GOOD','FAIR','POOR','DAMAGED')
  )
);

CREATE INDEX idx_equipment_serial_number       ON equipment(serial_number);
CREATE INDEX idx_equipment_status              ON equipment(status);
CREATE INDEX idx_equipment_category_id         ON equipment(category_id);
CREATE INDEX idx_equipment_home_base_id        ON equipment(home_base_id);
CREATE INDEX idx_equipment_current_custodian   ON equipment(current_custodian_id);
CREATE INDEX idx_equipment_is_deleted          ON equipment(is_deleted);
CREATE INDEX idx_equipment_status_base         ON equipment(status, home_base_id);
CREATE INDEX idx_equipment_tags                ON equipment USING gin(tags);
CREATE INDEX idx_equipment_specs               ON equipment USING gin(specifications);

CREATE TRIGGER set_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 6: equipment_vectors (pgvector)
-- ============================================================
CREATE TABLE equipment_vectors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID        NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  embedding    vector(384) NOT NULL,
  text_content TEXT        NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_equipment_vectors_equipment_id UNIQUE(equipment_id)
);

CREATE INDEX idx_equipment_vectors_ivfflat
  ON equipment_vectors
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- TABLE 7: checkout_records (APPEND-ONLY)
-- ============================================================
CREATE TABLE checkout_records (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id                UUID        NOT NULL REFERENCES equipment(id),
  equipment_serial            VARCHAR(50) NOT NULL,
  equipment_name              VARCHAR(150) NOT NULL,
  checked_out_by_id           UUID        NOT NULL REFERENCES personnel(id),
  checked_out_by_name         VARCHAR(100) NOT NULL,
  checked_out_by_service_number VARCHAR(20) NOT NULL,
  approved_by_id              UUID        REFERENCES personnel(id),
  approved_by_name            VARCHAR(100),
  checkout_base_id            UUID        NOT NULL REFERENCES bases(id),
  checkout_unit_id            UUID        REFERENCES units(id),
  purpose                     VARCHAR(30) NOT NULL,
  mission_name                VARCHAR(200),
  mission_id                  UUID,
  expected_return_at          TIMESTAMPTZ NOT NULL,
  actual_checkout_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actual_return_at            TIMESTAMPTZ,
  status                      VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  condition_on_checkout       VARCHAR(20) NOT NULL,
  condition_on_return         VARCHAR(20),
  return_notes                TEXT,
  digital_signature_data      TEXT        NOT NULL,
  signature_verified_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  biometric_verified          BOOLEAN     NOT NULL DEFAULT false,
  biometric_type              VARCHAR(20),
  biometric_verified_at       TIMESTAMPTZ,
  checkout_latitude           DECIMAL(10,8),
  checkout_longitude          DECIMAL(11,8),
  return_latitude             DECIMAL(10,8),
  return_longitude            DECIMAL(11,8),
  notes                       TEXT,
  escalation_level            INTEGER     NOT NULL DEFAULT 0,
  last_escalated_at           TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_checkout_purpose CHECK (
    purpose IN ('MISSION','TRAINING','MAINTENANCE','INSPECTION','EXERCISE','EMERGENCY')
  ),
  CONSTRAINT chk_checkout_status CHECK (
    status IN ('ACTIVE','RETURNED','OVERDUE','LOST','ESCALATED')
  ),
  CONSTRAINT chk_checkout_biometric_type CHECK (
    biometric_type IN ('FINGERPRINT','FACE_ID','PIN_OVERRIDE') OR biometric_type IS NULL
  ),
  CONSTRAINT chk_checkout_escalation CHECK (escalation_level BETWEEN 0 AND 3)
);

CREATE INDEX idx_checkout_equipment_id     ON checkout_records(equipment_id);
CREATE INDEX idx_checkout_by_id            ON checkout_records(checked_out_by_id);
CREATE INDEX idx_checkout_status           ON checkout_records(status);
CREATE INDEX idx_checkout_base_id          ON checkout_records(checkout_base_id);
CREATE INDEX idx_checkout_at               ON checkout_records(actual_checkout_at);
CREATE INDEX idx_checkout_expected_return  ON checkout_records(expected_return_at);
CREATE INDEX idx_checkout_overdue          ON checkout_records(status, expected_return_at)
  WHERE status = 'ACTIVE';

CREATE TRIGGER set_checkout_updated_at
  BEFORE UPDATE ON checkout_records
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Now we can add the FK on equipment for current_checkout_id
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_current_checkout
  FOREIGN KEY (current_checkout_id) REFERENCES checkout_records(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE 8: custody_chain (IMMUTABLE — no updated_at)
-- ============================================================
CREATE TABLE custody_chain (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id        UUID        NOT NULL REFERENCES equipment(id),
  event_type          VARCHAR(30) NOT NULL,
  from_custodian_id   UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  from_custodian_name VARCHAR(100),
  to_custodian_id     UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  to_custodian_name   VARCHAR(100),
  from_location       VARCHAR(200),
  to_location         VARCHAR(200),
  checkout_record_id  UUID        REFERENCES checkout_records(id),
  transfer_id         UUID,
  incident_id         UUID,
  maintenance_id      UUID,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by_id     UUID        NOT NULL REFERENCES personnel(id),
  performed_by_name   VARCHAR(100) NOT NULL,
  notes               TEXT,
  latitude            DECIMAL(10,8),
  longitude           DECIMAL(11,8),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_custody_event_type CHECK (
    event_type IN (
      'INITIAL_ENTRY','CHECKED_OUT','RETURNED','TRANSFERRED',
      'REPORTED_LOST','REPORTED_MISSING','SENT_FOR_MAINTENANCE',
      'RETURNED_FROM_MAINTENANCE','DECOMMISSIONED','FLAGGED','RECOVERED'
    )
  )
);

CREATE INDEX idx_custody_equipment_id ON custody_chain(equipment_id);
CREATE INDEX idx_custody_timestamp    ON custody_chain(timestamp DESC);
CREATE INDEX idx_custody_event_type   ON custody_chain(event_type);
CREATE INDEX idx_custody_performed_by ON custody_chain(performed_by_id);

-- ============================================================
-- TABLE 9: audit_logs (INSERT-ONLY, PARTITIONED BY MONTH)
-- ============================================================
CREATE TABLE audit_logs (
  id                        UUID        NOT NULL DEFAULT gen_random_uuid(),
  timestamp                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action                    VARCHAR(60) NOT NULL,
  performed_by_id           UUID,
  performed_by_name         VARCHAR(100),
  performed_by_role         VARCHAR(30),
  performed_by_service_number VARCHAR(20),
  target_entity_type        VARCHAR(30),
  target_entity_id          UUID,
  target_entity_name        VARCHAR(200),
  changes_before            JSONB,
  changes_after             JSONB,
  ip_address                VARCHAR(45),
  user_agent                TEXT,
  device_type               VARCHAR(20),
  device_id                 VARCHAR(200),
  severity                  VARCHAR(20) NOT NULL DEFAULT 'INFO',
  is_anomaly                BOOLEAN     NOT NULL DEFAULT false,
  anomaly_score             DECIMAL(5,4),
  session_id                VARCHAR(200),
  request_id                VARCHAR(200),
  additional_context        JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_audit_action CHECK (
    action IN (
      'EQUIPMENT_CHECKOUT','EQUIPMENT_CHECKIN','STATUS_CHANGE',
      'TRANSFER_REQUEST_CREATED','TRANSFER_APPROVED','TRANSFER_REJECTED',
      'TRANSFER_DISPATCHED','TRANSFER_RECEIVED',
      'INCIDENT_REPORTED','INCIDENT_RESOLVED',
      'MAINTENANCE_SCHEDULED','MAINTENANCE_COMPLETED','TECHNICIAN_SIGNOFF',
      'PERSONNEL_CREATED','PERSONNEL_UPDATED','PERSONNEL_DEACTIVATED','ROLE_CHANGED',
      'LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','PASSWORD_CHANGED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'ALERT_CREATED','ALERT_ACKNOWLEDGED','ALERT_ESCALATED',
      'AUDIT_LOG_EXPORTED','REPORT_GENERATED','CONFIG_CHANGED',
      'EQUIPMENT_ADDED','EQUIPMENT_DECOMMISSIONED',
      'SIGNATURE_CAPTURED','BIOMETRIC_SUCCESS','BIOMETRIC_FAILED',
      'OFFLINE_SYNC_COMPLETED','ANOMALY_DETECTED'
    )
  ),
  CONSTRAINT chk_audit_device_type CHECK (
    device_type IN ('WEB','MOBILE','SYSTEM') OR device_type IS NULL
  ),
  CONSTRAINT chk_audit_severity CHECK (
    severity IN ('INFO','WARNING','CRITICAL','EMERGENCY')
  )
) PARTITION BY RANGE (created_at);

-- Create partitions for current and next 3 months
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE audit_logs_2024_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE audit_logs_2024_04 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE audit_logs_2024_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE audit_logs_2024_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE audit_logs_2024_07 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE audit_logs_2024_08 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE audit_logs_2024_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE audit_logs_2024_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE audit_logs_2024_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE audit_logs_2024_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE audit_logs_2025_04 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE audit_logs_2025_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE audit_logs_2025_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE audit_logs_2025_07 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE audit_logs_2025_08 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE audit_logs_2025_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_logs_2026_04 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_logs_2026_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_logs_2026_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_logs_2026_07 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_logs_2026_08 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit_logs_2026_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit_logs_2026_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_audit_timestamp      ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_performed_by   ON audit_logs(performed_by_id);
CREATE INDEX idx_audit_action         ON audit_logs(action);
CREATE INDEX idx_audit_target_entity  ON audit_logs(target_entity_id);
CREATE INDEX idx_audit_severity       ON audit_logs(severity);
CREATE INDEX idx_audit_is_anomaly     ON audit_logs(is_anomaly) WHERE is_anomaly = true;

-- ============================================================
-- TABLE 10: alerts
-- ============================================================
CREATE TABLE alerts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type                VARCHAR(50) NOT NULL,
  severity            VARCHAR(20) NOT NULL,
  title               VARCHAR(200) NOT NULL,
  message             TEXT        NOT NULL,
  equipment_id        UUID        REFERENCES equipment(id) ON DELETE SET NULL,
  personnel_id        UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  checkout_id         UUID        REFERENCES checkout_records(id) ON DELETE SET NULL,
  base_id             UUID        REFERENCES bases(id) ON DELETE SET NULL,
  unit_id             UUID        REFERENCES units(id) ON DELETE SET NULL,
  assignee_id         UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  acknowledged_by_id  UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  acknowledged_at     TIMESTAMPTZ,
  resolved_by_id      UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  resolved_at         TIMESTAMPTZ,
  resolution_notes    TEXT,
  escalation_level    INTEGER     NOT NULL DEFAULT 0,
  escalated_to_id     UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  escalated_at        TIMESTAMPTZ,
  auto_generated      BOOLEAN     NOT NULL DEFAULT true,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_alert_type CHECK (
    type IN (
      'OVERDUE_RETURN','MAINTENANCE_DUE','LOW_STOCK','UNAUTHORIZED_ACCESS',
      'FAILED_LOGIN','EQUIPMENT_LOST','EQUIPMENT_MISSING','ANOMALY_DETECTED',
      'GEOFENCE_BREACH','TRANSFER_PENDING_APPROVAL','ESCALATION_REQUIRED',
      'EQUIPMENT_DAMAGED','BATTERY_LOW_TRACKER'
    )
  ),
  CONSTRAINT chk_alert_severity CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  CONSTRAINT chk_alert_status   CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED','ESCALATED','DISMISSED'))
);

CREATE INDEX idx_alerts_status       ON alerts(status);
CREATE INDEX idx_alerts_severity     ON alerts(severity);
CREATE INDEX idx_alerts_equipment_id ON alerts(equipment_id);
CREATE INDEX idx_alerts_assignee_id  ON alerts(assignee_id);
CREATE INDEX idx_alerts_base_id      ON alerts(base_id);
CREATE INDEX idx_alerts_created_at   ON alerts(created_at DESC);

CREATE TRIGGER set_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 11: maintenance_records
-- ============================================================
CREATE TABLE maintenance_records (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id                UUID        NOT NULL REFERENCES equipment(id),
  equipment_serial            VARCHAR(50) NOT NULL,
  type                        VARCHAR(30) NOT NULL,
  status                      VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
  scheduled_date              DATE        NOT NULL,
  actual_start_date           DATE,
  actual_completion_date      DATE,
  assigned_technician_id      UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  assigned_technician_name    VARCHAR(100),
  description                 TEXT,
  work_performed              TEXT,
  parts_replaced              JSONB,
  total_cost                  DECIMAL(10,2),
  condition_before            VARCHAR(20),
  condition_after             VARCHAR(20),
  technician_signoff          BOOLEAN     NOT NULL DEFAULT false,
  technician_signoff_at       TIMESTAMPTZ,
  technician_signature_data   TEXT,
  next_maintenance_recommended DATE,
  is_fit_for_duty             BOOLEAN,
  notes                       TEXT,
  created_by                  UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_maintenance_type CHECK (
    type IN ('ROUTINE','EMERGENCY','CALIBRATION','INSPECTION','OVERHAUL','REPAIR')
  ),
  CONSTRAINT chk_maintenance_status CHECK (
    status IN ('SCHEDULED','IN_PROGRESS','COMPLETED','OVERDUE','CANCELLED')
  )
);

CREATE INDEX idx_maintenance_equipment_id ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_status       ON maintenance_records(status);
CREATE INDEX idx_maintenance_scheduled    ON maintenance_records(scheduled_date);
CREATE INDEX idx_maintenance_technician   ON maintenance_records(assigned_technician_id);

CREATE TRIGGER set_maintenance_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 12: transfer_requests
-- ============================================================
CREATE TABLE transfer_requests (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id            UUID        NOT NULL REFERENCES equipment(id),
  equipment_serial        VARCHAR(50) NOT NULL,
  request_type            VARCHAR(30) NOT NULL,
  from_base_id            UUID        REFERENCES bases(id),
  from_unit_id            UUID        REFERENCES units(id),
  to_base_id              UUID        NOT NULL REFERENCES bases(id),
  to_unit_id              UUID        REFERENCES units(id),
  requested_by_id         UUID        NOT NULL REFERENCES personnel(id),
  requesting_officer_id   UUID        NOT NULL REFERENCES personnel(id),
  receiving_officer_id    UUID        NOT NULL REFERENCES personnel(id),
  status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  reason                  TEXT        NOT NULL,
  priority                VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  requested_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sender_approved_at      TIMESTAMPTZ,
  receiver_approved_at    TIMESTAMPTZ,
  dispatched_at           TIMESTAMPTZ,
  received_at             TIMESTAMPTZ,
  rejected_at             TIMESTAMPTZ,
  rejection_reason        TEXT,
  expected_arrival_date   DATE,
  actual_arrival_date     DATE,
  dispatch_latitude       DECIMAL(10,8),
  dispatch_longitude      DECIMAL(11,8),
  receipt_latitude        DECIMAL(10,8),
  receipt_longitude       DECIMAL(11,8),
  tracking_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_transfer_type CHECK (
    request_type IN ('INTER_UNIT','INTER_BASE','TEMPORARY_LOAN','PERMANENT_TRANSFER')
  ),
  CONSTRAINT chk_transfer_status CHECK (
    status IN (
      'PENDING','APPROVED_SENDER','APPROVED_RECEIVER','FULLY_APPROVED',
      'DISPATCHED','IN_TRANSIT','RECEIVED','REJECTED','CANCELLED'
    )
  ),
  CONSTRAINT chk_transfer_priority CHECK (
    priority IN ('LOW','NORMAL','HIGH','URGENT')
  )
);

CREATE INDEX idx_transfer_equipment_id       ON transfer_requests(equipment_id);
CREATE INDEX idx_transfer_status             ON transfer_requests(status);
CREATE INDEX idx_transfer_requested_by       ON transfer_requests(requested_by_id);
CREATE INDEX idx_transfer_requesting_officer ON transfer_requests(requesting_officer_id);
CREATE INDEX idx_transfer_receiving_officer  ON transfer_requests(receiving_officer_id);

CREATE TRIGGER set_transfer_updated_at
  BEFORE UPDATE ON transfer_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Add deferred FK from custody_chain to transfer_requests
ALTER TABLE custody_chain ADD CONSTRAINT fk_custody_transfer
  FOREIGN KEY (transfer_id) REFERENCES transfer_requests(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE 13: incident_reports
-- ============================================================
CREATE TABLE incident_reports (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number                 VARCHAR(30) NOT NULL,
  equipment_id                    UUID        NOT NULL REFERENCES equipment(id),
  equipment_serial                VARCHAR(50) NOT NULL,
  type                            VARCHAR(30) NOT NULL,
  severity                        VARCHAR(20) NOT NULL,
  title                           VARCHAR(200) NOT NULL,
  description                     TEXT        NOT NULL,
  incident_datetime               TIMESTAMPTZ NOT NULL,
  reported_by_id                  UUID        NOT NULL REFERENCES personnel(id),
  reported_by_name                VARCHAR(100) NOT NULL,
  responsible_personnel_id        UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  responsible_personnel_name      VARCHAR(100),
  last_known_latitude             DECIMAL(10,8),
  last_known_longitude            DECIMAL(11,8),
  last_known_location_description VARCHAR(500),
  status                          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  investigation_notes             TEXT,
  resolved_by_id                  UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  resolved_at                     TIMESTAMPTZ,
  resolution_description          TEXT,
  attachments                     TEXT[],
  witness_personnel_ids           UUID[],
  police_report_number            VARCHAR(100),
  estimated_value_loss            DECIMAL(12,2),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_incident_number UNIQUE(incident_number),
  CONSTRAINT chk_incident_type CHECK (
    type IN ('DAMAGED','LOST','STOLEN','DESTROYED','FOUND','TAMPERED')
  ),
  CONSTRAINT chk_incident_severity CHECK (
    severity IN ('MINOR','MODERATE','SEVERE','CRITICAL')
  ),
  CONSTRAINT chk_incident_status CHECK (
    status IN ('OPEN','UNDER_INVESTIGATION','RESOLVED','CLOSED','ESCALATED')
  )
);

CREATE INDEX idx_incident_equipment_id ON incident_reports(equipment_id);
CREATE INDEX idx_incident_status       ON incident_reports(status);
CREATE INDEX idx_incident_type         ON incident_reports(type);
CREATE INDEX idx_incident_reported_by  ON incident_reports(reported_by_id);

CREATE TRIGGER set_incident_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Add deferred FK from custody_chain to incident_reports
ALTER TABLE custody_chain ADD CONSTRAINT fk_custody_incident
  FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE SET NULL;

-- Add deferred FK from custody_chain to maintenance_records
ALTER TABLE custody_chain ADD CONSTRAINT fk_custody_maintenance
  FOREIGN KEY (maintenance_id) REFERENCES maintenance_records(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE 14: location_pings (WEEKLY PARTITIONED)
-- ============================================================
CREATE TABLE location_pings (
  id                       UUID        NOT NULL DEFAULT gen_random_uuid(),
  equipment_id             UUID        REFERENCES equipment(id) ON DELETE SET NULL,
  personnel_id             UUID        NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  checkout_id              UUID        REFERENCES checkout_records(id) ON DELETE SET NULL,
  latitude                 DECIMAL(10,8) NOT NULL,
  longitude                DECIMAL(11,8) NOT NULL,
  accuracy_meters          DECIMAL(8,2),
  altitude_meters          DECIMAL(8,2),
  speed_kmph               DECIMAL(6,2),
  heading_degrees          DECIMAL(6,2),
  is_in_authorized_zone    BOOLEAN     NOT NULL DEFAULT true,
  zone_name                VARCHAR(100),
  geofence_alert_triggered BOOLEAN     NOT NULL DEFAULT false,
  device_battery_percent   INTEGER,
  signal_strength          VARCHAR(20),
  timestamp                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create weekly partitions for next 13 weeks from April 2026
CREATE TABLE location_pings_2026_w14 PARTITION OF location_pings
  FOR VALUES FROM ('2026-03-30') TO ('2026-04-06');
CREATE TABLE location_pings_2026_w15 PARTITION OF location_pings
  FOR VALUES FROM ('2026-04-06') TO ('2026-04-13');
CREATE TABLE location_pings_2026_w16 PARTITION OF location_pings
  FOR VALUES FROM ('2026-04-13') TO ('2026-04-20');
CREATE TABLE location_pings_2026_w17 PARTITION OF location_pings
  FOR VALUES FROM ('2026-04-20') TO ('2026-04-27');
CREATE TABLE location_pings_2026_w18 PARTITION OF location_pings
  FOR VALUES FROM ('2026-04-27') TO ('2026-05-04');
CREATE TABLE location_pings_2026_w19 PARTITION OF location_pings
  FOR VALUES FROM ('2026-05-04') TO ('2026-05-11');
CREATE TABLE location_pings_2026_w20 PARTITION OF location_pings
  FOR VALUES FROM ('2026-05-11') TO ('2026-05-18');
CREATE TABLE location_pings_2026_w21 PARTITION OF location_pings
  FOR VALUES FROM ('2026-05-18') TO ('2026-05-25');
CREATE TABLE location_pings_2026_w22 PARTITION OF location_pings
  FOR VALUES FROM ('2026-05-25') TO ('2026-06-01');
CREATE TABLE location_pings_2026_w23 PARTITION OF location_pings
  FOR VALUES FROM ('2026-06-01') TO ('2026-06-08');
CREATE TABLE location_pings_2026_w24 PARTITION OF location_pings
  FOR VALUES FROM ('2026-06-08') TO ('2026-06-15');
CREATE TABLE location_pings_2026_w25 PARTITION OF location_pings
  FOR VALUES FROM ('2026-06-15') TO ('2026-06-22');
CREATE TABLE location_pings_2026_w26 PARTITION OF location_pings
  FOR VALUES FROM ('2026-06-22') TO ('2026-06-29');

CREATE INDEX idx_location_personnel_id ON location_pings(personnel_id, timestamp DESC);
CREATE INDEX idx_location_equipment_id ON location_pings(equipment_id, timestamp DESC);
CREATE INDEX idx_location_checkout_id  ON location_pings(checkout_id);
CREATE INDEX idx_location_timestamp    ON location_pings(timestamp DESC);
CREATE INDEX idx_location_geofence     ON location_pings(geofence_alert_triggered)
  WHERE geofence_alert_triggered = true;

-- ============================================================
-- TABLE 15: geofence_zones
-- ============================================================
CREATE TABLE geofence_zones (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    VARCHAR(100) NOT NULL,
  base_id                 UUID        REFERENCES bases(id) ON DELETE CASCADE,
  type                    VARCHAR(20) NOT NULL,
  shape                   VARCHAR(20) NOT NULL,
  center_latitude         DECIMAL(10,8),
  center_longitude        DECIMAL(11,8),
  radius_meters           DECIMAL(10,2),
  polygon_coordinates     JSONB,
  alert_on_entry          BOOLEAN     NOT NULL DEFAULT false,
  alert_on_exit           BOOLEAN     NOT NULL DEFAULT true,
  applicable_to_roles     TEXT[],
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  created_by              UUID        REFERENCES personnel(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_geofence_type  CHECK (type  IN ('AUTHORIZED','RESTRICTED','DANGER','PERIMETER')),
  CONSTRAINT chk_geofence_shape CHECK (shape IN ('CIRCLE','POLYGON'))
);

CREATE INDEX idx_geofence_base_id   ON geofence_zones(base_id);
CREATE INDEX idx_geofence_is_active ON geofence_zones(is_active);

CREATE TRIGGER set_geofence_updated_at
  BEFORE UPDATE ON geofence_zones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE 16: offline_sync_queue
-- ============================================================
CREATE TABLE offline_sync_queue (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id          VARCHAR(200) NOT NULL,
  personnel_id       UUID        NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  action_type        VARCHAR(50) NOT NULL,
  payload            JSONB       NOT NULL,
  created_offline_at TIMESTAMPTZ NOT NULL,
  synced_at          TIMESTAMPTZ,
  sync_status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  conflict_details   JSONB,
  retry_count        INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_offline_action_type CHECK (
    action_type IN ('CHECKOUT','CHECKIN','INCIDENT_REPORT','LOCATION_PING','BIOMETRIC_CHECKOUT')
  ),
  CONSTRAINT chk_offline_sync_status CHECK (
    sync_status IN ('PENDING','SYNCED','FAILED','CONFLICT')
  )
);

CREATE INDEX idx_offline_personnel_id ON offline_sync_queue(personnel_id);
CREATE INDEX idx_offline_device_id    ON offline_sync_queue(device_id);
CREATE INDEX idx_offline_sync_status  ON offline_sync_queue(sync_status);
CREATE INDEX idx_offline_created_at   ON offline_sync_queue(created_at);

-- ============================================================
-- AUTO-INCREMENT incident number function
-- ============================================================
CREATE SEQUENCE incident_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.incident_number := 'INC-' || EXTRACT(YEAR FROM NOW()) || '-' ||
                         LPAD(nextval('incident_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incident_number
  BEFORE INSERT ON incident_reports
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL OR NEW.incident_number = '')
  EXECUTE FUNCTION generate_incident_number();

-- ============================================================
-- VIEWS for common dashboard queries
-- ============================================================

-- Active equipment checkouts with personnel info
CREATE VIEW v_active_checkouts AS
SELECT
  cr.id,
  cr.equipment_id,
  cr.equipment_serial,
  cr.equipment_name,
  cr.checked_out_by_name,
  cr.checked_out_by_service_number,
  cr.purpose,
  cr.actual_checkout_at,
  cr.expected_return_at,
  cr.status,
  cr.escalation_level,
  EXTRACT(EPOCH FROM (NOW() - cr.expected_return_at))/3600 AS hours_overdue,
  b.name AS base_name,
  u.name AS unit_name
FROM checkout_records cr
JOIN bases b ON b.id = cr.checkout_base_id
LEFT JOIN units u ON u.id = cr.checkout_unit_id
WHERE cr.status IN ('ACTIVE','OVERDUE','ESCALATED');

-- Equipment status summary per base
CREATE VIEW v_equipment_status_by_base AS
SELECT
  b.id AS base_id,
  b.name AS base_name,
  COUNT(*) FILTER (WHERE e.status = 'OPERATIONAL')       AS operational,
  COUNT(*) FILTER (WHERE e.status = 'CHECKED_OUT')       AS checked_out,
  COUNT(*) FILTER (WHERE e.status = 'UNDER_MAINTENANCE') AS under_maintenance,
  COUNT(*) FILTER (WHERE e.status = 'LOST')              AS lost,
  COUNT(*) FILTER (WHERE e.status = 'MISSING')           AS missing,
  COUNT(*) FILTER (WHERE e.status = 'FLAGGED')           AS flagged,
  COUNT(*)                                               AS total
FROM equipment e
JOIN bases b ON b.id = e.home_base_id
WHERE e.is_deleted = false
GROUP BY b.id, b.name;

-- Open alerts summary
CREATE VIEW v_open_alerts_summary AS
SELECT
  type,
  severity,
  COUNT(*) AS count
FROM alerts
WHERE status IN ('OPEN','ACKNOWLEDGED','ESCALATED')
GROUP BY type, severity
ORDER BY
  CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3 ELSE 4 END,
  count DESC;

-- ============================================================
-- DONE
-- ============================================================
COMMENT ON DATABASE deas_db IS
  'Defence Equipment Accountability System — PostgreSQL 16 + pgvector';
