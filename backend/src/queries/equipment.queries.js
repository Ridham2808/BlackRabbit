// ============================================================
// EQUIPMENT QUERIES
// ============================================================

const EQUIPMENT_QUERIES = {
  LIST: `
    SELECT
      e.id, e.serial_number, e.name, e.status, e.condition,
      e.manufacturer, e.model_number, e.purchase_date, e.purchase_price,
      e.total_checkout_count, e.total_usage_hours,
      e.last_maintenance_at, e.next_maintenance_due,
      e.qr_code_url, e.tags, e.images, e.specifications,
      e.last_known_latitude, e.last_known_longitude, e.last_location_update_at,
      e.created_at, e.updated_at,
      ec.name         AS category_name,
      ec.display_name AS category_display,
      ec.criticality_level,
      b.name          AS home_base_name,
      un.name         AS home_unit_name,
      p.full_name     AS current_custodian_name,
      p.service_number AS current_custodian_service_number
    FROM equipment e
    LEFT JOIN equipment_categories ec ON ec.id = e.category_id
    LEFT JOIN bases               b   ON b.id  = e.home_base_id
    LEFT JOIN units               un  ON un.id = e.home_unit_id
    LEFT JOIN personnel           p   ON p.id  = e.current_custodian_id
    WHERE e.is_deleted = false
  `,

  GET_BY_ID: `
    SELECT
      e.*,
      ec.name AS category_name, ec.display_name AS category_display,
      ec.criticality_level, ec.maintenance_interval_days, ec.max_checkout_hours,
      ec.requires_officer_approval,
      b.name  AS home_base_name,
      un.name AS home_unit_name,
      p.full_name AS current_custodian_name,
      p.service_number AS current_custodian_service_number
    FROM equipment e
    LEFT JOIN equipment_categories ec ON ec.id = e.category_id
    LEFT JOIN bases               b   ON b.id  = e.home_base_id
    LEFT JOIN units               un  ON un.id = e.home_unit_id
    LEFT JOIN personnel           p   ON p.id  = e.current_custodian_id
    WHERE e.id = $1 AND e.is_deleted = false
    LIMIT 1
  `,

  GET_BY_SERIAL: `
    SELECT e.*, ec.name AS category_name, ec.display_name AS category_display,
           ec.max_checkout_hours, ec.requires_officer_approval
    FROM equipment e
    LEFT JOIN equipment_categories ec ON ec.id = e.category_id
    WHERE e.serial_number = $1 AND e.is_deleted = false
    LIMIT 1
  `,

  CREATE: `
    INSERT INTO equipment (
      serial_number, name, category_id, description, manufacturer, model_number,
      purchase_date, purchase_price, status, condition, home_base_id, home_unit_id,
      tags, specifications, images, notes, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING *
  `,

  UPDATE: `
    UPDATE equipment
    SET name = $2, category_id = $3, description = $4, manufacturer = $5,
        model_number = $6, condition = $7, tags = $8, specifications = $9,
        images = $10, notes = $11, updated_at = NOW()
    WHERE id = $1 AND is_deleted = false
    RETURNING *
  `,

  UPDATE_STATUS: `
    UPDATE equipment
    SET status = $2, updated_at = NOW()
    WHERE id = $1 AND is_deleted = false
    RETURNING id, serial_number, name, status
  `,

  UPDATE_QR_URL: `
    UPDATE equipment SET qr_code_url = $2, updated_at = NOW() WHERE id = $1
  `,

  UPDATE_CUSTODIAN: `
    UPDATE equipment
    SET current_custodian_id = $2, current_checkout_id = $3,
        status = $4, updated_at = NOW()
    WHERE id = $1
  `,

  UPDATE_LOCATION: `
    UPDATE equipment
    SET last_known_latitude = $2, last_known_longitude = $3,
        last_location_update_at = NOW(), updated_at = NOW()
    WHERE id = $1
  `,

  UPDATE_USAGE_HOURS: `
    UPDATE equipment
    SET total_usage_hours = total_usage_hours + $2,
        total_checkout_count = total_checkout_count + 1,
        updated_at = NOW()
    WHERE id = $1
  `,

  SOFT_DELETE: `
    UPDATE equipment
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1 AND is_deleted = false
    RETURNING id
  `,

  COUNT_BY_STATUS_FOR_BASE: `
    SELECT status, COUNT(*) AS count
    FROM equipment
    WHERE home_base_id = $1 AND is_deleted = false
    GROUP BY status
  `,

  DUE_FOR_MAINTENANCE: `
    SELECT e.id, e.serial_number, e.name, e.next_maintenance_due,
           ec.maintenance_interval_days, b.id AS base_id, b.name AS base_name
    FROM equipment e
    JOIN equipment_categories ec ON ec.id = e.category_id
    JOIN bases b ON b.id = e.home_base_id
    WHERE e.next_maintenance_due <= NOW() + INTERVAL '7 days'
      AND e.status NOT IN ('DECOMMISSIONED','LOST','MISSING')
      AND e.is_deleted = false
    ORDER BY e.next_maintenance_due ASC
  `,
};

module.exports = { EQUIPMENT_QUERIES };
