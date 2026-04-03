// ============================================================
// MAINTENANCE QUERIES
// ============================================================

const MAINTENANCE_QUERIES = {
  LIST: `
    SELECT
      mr.id, mr.equipment_id, mr.equipment_serial, mr.type, mr.status,
      mr.scheduled_date, mr.actual_start_date, mr.actual_completion_date,
      mr.assigned_technician_id, mr.assigned_technician_name,
      mr.work_performed, mr.total_cost, mr.condition_before, mr.condition_after,
      mr.technician_signoff, mr.is_fit_for_duty, mr.next_maintenance_recommended,
      mr.created_at,
      e.name AS equipment_name
    FROM maintenance_records mr
    LEFT JOIN equipment e ON e.id = mr.equipment_id
    WHERE 1=1
  `,

  GET_BY_ID: `
    SELECT mr.*, e.name AS equipment_name, e.serial_number
    FROM maintenance_records mr
    LEFT JOIN equipment e ON e.id = mr.equipment_id
    WHERE mr.id = $1
    LIMIT 1
  `,

  CREATE: `
    INSERT INTO maintenance_records (
      equipment_id, equipment_serial, type, status, scheduled_date,
      assigned_technician_id, assigned_technician_name, notes
    ) VALUES ($1, $2, $3, 'SCHEDULED', $4, $5, $6, $7)
    RETURNING *
  `,

  START: `
    UPDATE maintenance_records
    SET status = 'IN_PROGRESS', actual_start_date = NOW()
    WHERE id = $1
    RETURNING *
  `,

  COMPLETE: `
    UPDATE maintenance_records
    SET status = 'COMPLETED',
        actual_completion_date = NOW(),
        work_performed = $2,
        parts_replaced = $3,
        total_cost = $4,
        condition_before = $5,
        condition_after = $6,
        technician_signoff = true,
        technician_signature_data = $7,
        is_fit_for_duty = $8,
        next_maintenance_recommended = $9
    WHERE id = $1
    RETURNING *
  `,

  CANCEL: `
    UPDATE maintenance_records SET status = 'CANCELLED' WHERE id = $1 RETURNING *
  `,

  UPDATE_EQUIPMENT_DATES: `
    UPDATE equipment
    SET last_maintenance_at = NOW(),
        next_maintenance_due = $2,
        updated_at = NOW()
    WHERE id = $1
  `,
};

module.exports = { MAINTENANCE_QUERIES };
