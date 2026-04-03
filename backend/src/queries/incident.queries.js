// ============================================================
// INCIDENT QUERIES
// ============================================================

const INCIDENT_QUERIES = {
  LIST: `
    SELECT
      ir.id, ir.incident_number, ir.equipment_id, ir.type, ir.severity,
      ir.status, ir.description, ir.last_known_location_description,
      ir.responsible_personnel_id, ir.responsible_personnel_name,
      ir.estimated_value_loss, ir.created_at,
      e.name AS equipment_name, e.serial_number
    FROM incident_reports ir
    LEFT JOIN equipment e ON e.id = ir.equipment_id
    WHERE 1=1
  `,

  GET_BY_ID: `
    SELECT ir.*, e.name AS equipment_name, e.serial_number
    FROM incident_reports ir
    LEFT JOIN equipment e ON e.id = ir.equipment_id
    WHERE ir.id = $1
    LIMIT 1
  `,

  CREATE: `
    INSERT INTO incident_reports (
      incident_number, equipment_id, equipment_serial, type, severity, status,
      description, responsible_personnel_id, responsible_personnel_name,
      last_known_latitude, last_known_longitude, last_known_location_description,
      estimated_value_loss, reported_by_id, base_id
    ) VALUES ($1, $2, $3, $4, $5, 'OPEN', $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `,

  UPDATE_STATUS: `
    UPDATE incident_reports
    SET status = $2, investigation_notes = $3, updated_at = NOW()
    WHERE id = $1 RETURNING *
  `,

  CLOSE: `
    UPDATE incident_reports
    SET status = 'CLOSED', resolved_at = NOW(), resolution_notes = $2
    WHERE id = $1 RETURNING *
  `,
};

module.exports = { INCIDENT_QUERIES };
