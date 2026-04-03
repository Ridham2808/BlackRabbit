// ============================================================
// TRANSFER QUERIES
// ============================================================

const TRANSFER_QUERIES = {
  LIST: `
    SELECT
      tr.id, tr.equipment_id, tr.type, tr.status, tr.priority,
      tr.requesting_officer_id, tr.from_unit_id, tr.from_base_id,
      tr.to_unit_id, tr.to_base_id, tr.reason, tr.created_at,
      e.name AS equipment_name, e.serial_number,
      p_req.full_name AS requesting_officer_name,
      fb.name AS from_base_name,
      tb.name AS to_base_name,
      fu.name AS from_unit_name,
      tu.name AS to_unit_name
    FROM transfer_requests tr
    LEFT JOIN equipment e ON e.id = tr.equipment_id
    LEFT JOIN personnel p_req ON p_req.id = tr.requesting_officer_id
    LEFT JOIN bases fb ON fb.id = tr.from_base_id
    LEFT JOIN bases tb ON tb.id = tr.to_base_id
    LEFT JOIN units fu ON fu.id = tr.from_unit_id
    LEFT JOIN units tu ON tu.id = tr.to_unit_id
    WHERE 1=1
  `,

  GET_BY_ID: `
    SELECT tr.*,
           e.name AS equipment_name, e.serial_number,
           p_req.full_name AS requesting_officer_name,
           p_rec.full_name AS receiving_officer_name
    FROM transfer_requests tr
    LEFT JOIN equipment e ON e.id = tr.equipment_id
    LEFT JOIN personnel p_req ON p_req.id = tr.requesting_officer_id
    LEFT JOIN personnel p_rec ON p_rec.id = tr.receiving_officer_id
    WHERE tr.id = $1
    LIMIT 1
  `,

  CREATE: `
    INSERT INTO transfer_requests (
      equipment_id, type, priority, status,
      requesting_officer_id, receiving_officer_id,
      from_unit_id, from_base_id, to_unit_id, to_base_id, reason, notes
    ) VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `,

  UPDATE_STATUS: `
    UPDATE transfer_requests SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *
  `,

  APPROVE_SENDER: `
    UPDATE transfer_requests
    SET status = 'APPROVED_SENDER', sender_approved_at = NOW(), sender_approved_by_id = $2
    WHERE id = $1 RETURNING *
  `,

  APPROVE_RECEIVER: `
    UPDATE transfer_requests
    SET status = 'FULLY_APPROVED', receiver_approved_at = NOW(), receiver_approved_by_id = $2
    WHERE id = $1 RETURNING *
  `,

  DISPATCH: `
    UPDATE transfer_requests
    SET status = 'DISPATCHED', dispatched_at = NOW(),
        dispatch_latitude = $2, dispatch_longitude = $3
    WHERE id = $1 RETURNING *
  `,

  RECEIVE: `
    UPDATE transfer_requests
    SET status = 'RECEIVED', received_at = NOW(),
        receipt_latitude = $2, receipt_longitude = $3
    WHERE id = $1 RETURNING *
  `,
};

module.exports = { TRANSFER_QUERIES };
