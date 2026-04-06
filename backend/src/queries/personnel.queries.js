// ============================================================
// PERSONNEL QUERIES
// ============================================================

const PERSONNEL_QUERIES = {
  LIST: `
    SELECT
      p.id, p.service_number, p.full_name, p.email, p.phone,
      p.role, p.rank, p.clearance_level, p.is_active,
      p.last_login_at, p.avatar_url, p.created_at,
      u.name AS unit_name,
      b.name AS base_name
    FROM personnel p
    LEFT JOIN units u ON u.id = p.unit_id
    LEFT JOIN bases b ON b.id = p.base_id
    WHERE p.is_deleted = false
  `,

  GET_BY_ID: `
    SELECT
      p.id, p.service_number, p.full_name, p.email, p.phone,
      p.role, p.rank, p.clearance_level, p.is_active,
      p.last_login_at, p.avatar_url, p.created_at,
      p.unit_id, p.base_id,
      u.name AS unit_name,
      b.name AS base_name
    FROM personnel p
    LEFT JOIN units u ON u.id = p.unit_id
    LEFT JOIN bases b ON b.id = p.base_id
    WHERE p.id = $1 AND p.is_deleted = false
    LIMIT 1
  `,

  CREATE: `
    INSERT INTO personnel (
      service_number, full_name, email, phone, password_hash,
      role, rank, unit_id, base_id, clearance_level, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    ) RETURNING id, service_number, full_name, email, role, rank,
                unit_id, base_id, clearance_level, is_active, created_at
  `,

  UPDATE: `
    UPDATE personnel
    SET full_name = $2, phone = $3, rank = $4, unit_id = $5,
        base_id = $6, clearance_level = $7, avatar_url = $8
    WHERE id = $1 AND is_deleted = false
    RETURNING id, service_number, full_name, email, role, rank, unit_id, base_id
  `,

  UPDATE_ROLE: `
    UPDATE personnel SET role = $2 WHERE id = $1 AND is_deleted = false
    RETURNING id, full_name, role
  `,

  TOGGLE_ACTIVE: `
    UPDATE personnel SET is_active = $2 WHERE id = $1 AND is_deleted = false
    RETURNING id, full_name, is_active
  `,

  CHANGE_PASSWORD: `
    UPDATE personnel SET password_hash = $2 WHERE id = $1
  `,

  SOFT_DELETE: `
    UPDATE personnel SET is_deleted = true WHERE id = $1 RETURNING id
  `,

  UNITS_LIST: `
    SELECT u.id, u.name, u.code, u.base_id, u.is_active,
           b.name AS base_name,
           COUNT(p.id) AS personnel_count
    FROM units u
    LEFT JOIN bases b ON b.id = u.base_id
    LEFT JOIN personnel p ON p.unit_id = u.id AND p.is_deleted = false
    WHERE u.is_active = true
    GROUP BY u.id, b.name
    ORDER BY u.name
  `,

  BASES_LIST: `
    SELECT b.id, b.name, b.code, b.latitude, b.longitude, b.is_active,
           p.full_name AS commanding_officer_name
    FROM bases b
    LEFT JOIN personnel p ON p.id = b.commanding_officer_id
    WHERE b.is_active = true
    ORDER BY b.name
  `,
};

module.exports = { PERSONNEL_QUERIES };
