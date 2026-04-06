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
      title, incident_datetime,
      description, responsible_personnel_id, responsible_personnel_name,
      last_known_latitude, last_known_longitude, last_known_location_description,
      estimated_value_loss, reported_by_id, base_id, co_acknowledgment_required
    ) VALUES ($1, $2, $3, $4, $5, 'OPEN', $6, NOW(), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `,

  LINK_EQUIPMENT: `
    INSERT INTO incident_equipment_links (
      incident_id, equipment_id, equipment_serial, equipment_name, equipment_status_before
    ) VALUES ($1, $2, $3, $4, $5)
  `,

  GET_WITH_LINKS: `
    SELECT ir.*, 
      (SELECT json_agg(iel.*) FROM incident_equipment_links iel WHERE iel.incident_id = ir.id) as linked_equipment,
      (SELECT json_agg(iws.*) FROM incident_witness_statements iws WHERE iws.incident_id = ir.id) as witness_statements
    FROM incident_reports ir
    WHERE ir.id = $1
  `,

  SUBMIT_WITNESS_STATEMENT: `
    INSERT INTO incident_witness_statements (
      incident_id, witness_personnel_id, statement_text, statement_signature_data,
      witness_latitude, witness_longitude
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,

  CO_ACKNOWLEDGE: `
    UPDATE incident_reports
    SET co_acknowledged_by = $2, co_acknowledged_at = NOW(), co_signature_data = $3, status = 'CO_ACKNOWLEDGED'
    WHERE id = $1 RETURNING *
  `,

  ADD_INVESTIGATION_ENTRY: `
    UPDATE incident_reports
    SET investigation_trail = investigation_trail || $2::jsonb
    WHERE id = $1 RETURNING *
  `,

  RESOLVE_EQUIPMENT_LINK: `
    UPDATE incident_equipment_links
    SET resolution_status = $2, resolved_at = NOW(), resolution_notes = $3
    WHERE incident_id = $1 AND equipment_id = $4
  `,

  RECORD_SCORE_EVENT: `
    INSERT INTO accountability_score_events (
      personnel_id, incident_id, event_type, points_changed, reason, performed_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `,

  UPDATE_PERSONNEL_SCORE: `
    UPDATE personnel
    SET accountability_score = accountability_score + $2
    WHERE id = $1
  `,
};

module.exports = { INCIDENT_QUERIES };
