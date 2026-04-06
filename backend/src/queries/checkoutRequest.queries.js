
const CHECKOUT_REQUEST_QUERIES = {
  CREATE: `
    INSERT INTO checkout_requests (
      equipment_category_id, personnel_id, purpose,
      expected_return_at, location, status
    ) VALUES ($1, $2, $3, $4, $5, 'PENDING')
    RETURNING *;
  `,

  LIST_PENDING_BY_BASE: `
    SELECT cr.*, p.full_name AS requester_name, p.service_number AS requester_service_number,
           ec.display_name AS category_name
    FROM checkout_requests cr
    JOIN personnel p ON p.id = cr.personnel_id
    JOIN equipment_categories ec ON ec.id = cr.equipment_category_id
    WHERE p.base_id = $1 AND cr.status IN ('PENDING', 'APPROVED')
    ORDER BY cr.created_at ASC;
  `,

  LIST_BY_PERSONNEL: `
    SELECT cr.*, ec.display_name AS category_name
    FROM checkout_requests cr
    JOIN equipment_categories ec ON ec.id = cr.equipment_category_id
    WHERE cr.personnel_id = $1
    ORDER BY cr.created_at DESC;
  `,

  GET_BY_ID: `
    SELECT cr.*, p.full_name AS requester_name, p.service_number AS requester_service_number,
           ec.display_name AS category_name
    FROM checkout_requests cr
    JOIN personnel p ON p.id = cr.personnel_id
    JOIN equipment_categories ec ON ec.id = cr.equipment_category_id
    WHERE cr.id = $1;
  `,

  APPROVE: `
    UPDATE checkout_requests
    SET status = 'APPROVED', approved_by_id = $2, updated_at = NOW()
    WHERE id = $1 AND status = 'PENDING'
    RETURNING *;
  `,

  REJECT: `
    UPDATE checkout_requests
    SET status = 'REJECTED', approved_by_id = $2, rejection_reason = $3, updated_at = NOW()
    WHERE id = $1 AND status = 'PENDING'
    RETURNING *;
  `,

  COMPLETE: `
    UPDATE checkout_requests
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `
};

module.exports = { CHECKOUT_REQUEST_QUERIES };
