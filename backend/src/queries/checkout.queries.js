// ============================================================
// CHECKOUT QUERIES
// ============================================================

const CHECKOUT_QUERIES = {
  LIST: `
    SELECT
      cr.id, cr.equipment_id, cr.equipment_serial, cr.equipment_name,
      cr.checked_out_by_id, cr.checked_out_by_name, cr.checked_out_by_service_number,
      cr.approved_by_id, cr.purpose, cr.status,
      cr.actual_checkout_at, cr.expected_return_at, cr.actual_return_at,
      cr.condition_on_checkout, cr.condition_on_return,
      cr.biometric_verified, cr.biometric_type,
      cr.checkout_latitude, cr.checkout_longitude,
      cr.escalation_level, cr.last_escalated_at,
      cr.created_at,
      p_approver.full_name AS approved_by_name
    FROM checkout_records cr
    LEFT JOIN personnel p_approver ON p_approver.id = cr.approved_by_id
    WHERE 1=1
  `,

  GET_BY_ID: `
    SELECT cr.*, p.full_name AS approved_by_name
    FROM checkout_records cr
    LEFT JOIN personnel p ON p.id = cr.approved_by_id
    WHERE cr.id = $1
    LIMIT 1
  `,

  GET_ACTIVE_FOR_EQUIPMENT: `
    SELECT * FROM checkout_records
    WHERE equipment_id = $1 AND status = 'ACTIVE'
    LIMIT 1
  `,

  GET_BY_SOLDIER: `
    SELECT cr.*, e.name AS equipment_name_current, e.status AS equipment_status_current
    FROM checkout_records cr
    LEFT JOIN equipment e ON e.id = cr.equipment_id
    WHERE cr.checked_out_by_id = $1
    ORDER BY cr.actual_checkout_at DESC
  `,

  CREATE: `
    INSERT INTO checkout_records (
      equipment_id, equipment_serial, equipment_name,
      checked_out_by_id, checked_out_by_name, checked_out_by_service_number,
      approved_by_id, purpose, expected_return_at,
      actual_checkout_at, status, condition_on_checkout,
      digital_signature_data, biometric_verified, biometric_type,
      checkout_latitude, checkout_longitude, checkout_base_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      NOW(), 'ACTIVE', $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *
  `,

  CHECK_IN: `
    UPDATE checkout_records
    SET status = 'RETURNED',
        actual_return_at = NOW(),
        condition_on_return = $2,
        return_latitude = $3,
        return_longitude = $4,
        notes = $5
    WHERE id = $1
    RETURNING *
  `,

  MARK_OVERDUE: `
    UPDATE checkout_records
    SET status = 'OVERDUE'
    WHERE status = 'ACTIVE'
      AND expected_return_at < NOW()
    RETURNING id, equipment_id, checked_out_by_id, equipment_name,
              checked_out_by_name, expected_return_at
  `,

  ESCALATE: `
    UPDATE checkout_records
    SET escalation_level = escalation_level + 1,
        last_escalated_at = NOW(),
        status = 'ESCALATED'
    WHERE id = $1
    RETURNING *
  `,

  OVERDUE_LIST: `
    SELECT cr.id, cr.equipment_id, cr.equipment_name, cr.equipment_serial,
           cr.checked_out_by_id, cr.checked_out_by_name,
           cr.expected_return_at, cr.escalation_level,
           cr.checkout_base_id,
           EXTRACT(EPOCH FROM (NOW() - cr.expected_return_at))/3600 AS hours_overdue
    FROM checkout_records cr
    WHERE cr.status IN ('ACTIVE','OVERDUE','ESCALATED')
      AND cr.expected_return_at < NOW()
    ORDER BY cr.expected_return_at ASC
  `,

  DASHBOARD_STATS: `
    SELECT
      COUNT(*) FILTER (WHERE status = 'ACTIVE')    AS active,
      COUNT(*) FILTER (WHERE status = 'OVERDUE')   AS overdue,
      COUNT(*) FILTER (WHERE status = 'RETURNED'
        AND actual_return_at >= NOW() - INTERVAL '24 hours') AS returned_today
    FROM checkout_records
    WHERE checkout_base_id = $1
  `,
};

module.exports = { CHECKOUT_QUERIES };
