// ============================================================
// AUTH QUERIES
// ============================================================

const AUTH_QUERIES = {
  FIND_BY_SERVICE_NUMBER: `
    SELECT p.*, u.name as unit_name, b.name as base_name, b.id as base_id 
    FROM personnel p 
    LEFT JOIN units u ON p.unit_id = u.id 
    LEFT JOIN bases b ON p.base_id = b.id 
    WHERE p.service_number = $1 AND p.is_deleted = false
    LIMIT 1
  `,

  FIND_BY_ID: `
    SELECT p.*, u.name as unit_name, b.name as base_name, b.id as base_id 
    FROM personnel p 
    LEFT JOIN units u ON p.unit_id = u.id 
    LEFT JOIN bases b ON p.base_id = b.id 
    WHERE p.id = $1 AND p.is_deleted = false
    LIMIT 1
  `,

  RESET_FAILED_LOGIN: `
    UPDATE personnel
    SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW()
    WHERE id = $1
  `,

  INCREMENT_FAILED_LOGIN: `
    UPDATE personnel
    SET failed_login_count = failed_login_count + 1
    WHERE id = $1
    RETURNING failed_login_count
  `,

  LOCK_ACCOUNT: `
    UPDATE personnel
    SET locked_until = NOW() + INTERVAL '15 minutes'
    WHERE id = $1
  `,

  STORE_REFRESH_TOKEN: `
    UPDATE personnel
    SET refresh_token_hash = $2
    WHERE id = $1
  `,

  CLEAR_REFRESH_TOKEN: `
    UPDATE personnel
    SET refresh_token_hash = NULL
    WHERE id = $1
  `,

  STORE_DEVICE_TOKEN: `
    UPDATE personnel
    SET device_token = $2
    WHERE id = $1
  `,
};

module.exports = { AUTH_QUERIES };
