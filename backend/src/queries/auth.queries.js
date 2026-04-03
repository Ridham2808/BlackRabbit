// ============================================================
// AUTH QUERIES
// ============================================================

const AUTH_QUERIES = {
  FIND_BY_EMAIL: `
    SELECT id, service_number, full_name, email, password_hash,
           role, rank, unit_id, base_id, clearance_level,
           is_active, failed_login_count, locked_until,
           device_token, refresh_token_hash, biometric_token_hash
    FROM personnel
    WHERE email = $1 AND is_deleted = false
    LIMIT 1
  `,

  FIND_BY_ID: `
    SELECT p.id, p.service_number, p.full_name, p.email,
           p.role, p.rank, p.unit_id, p.base_id, p.clearance_level,
           p.is_active, p.avatar_url, p.device_token,
           u.name AS unit_name, b.name AS base_name
    FROM personnel p
    LEFT JOIN units u ON u.id = p.unit_id
    LEFT JOIN bases b ON b.id = p.base_id
    WHERE p.id = $1 AND p.is_deleted = false
    LIMIT 1
  `,

  UPDATE_LOGIN_SUCCESS: `
    UPDATE personnel
    SET last_login_at = NOW(), failed_login_count = 0, locked_until = NULL
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
    SET locked_until = NOW() + ($2 || ' minutes')::INTERVAL
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
