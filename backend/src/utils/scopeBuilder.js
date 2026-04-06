// ============================================================
// SCOPE BUILDER — Builds SQL WHERE clause fragments from role
// ============================================================

const { ROLES } = require('../constants/roles');

/**
 * Returns { clause, params, offset } based on user role.
 * clause  — SQL WHERE fragment (can be '' for super admins)
 * params  — values to bind
 * offset  — the next $N index after the injected params
 *
 * Usage:
 *   const { clause, params } = buildScope(req.user, 'e', 1);
 *   const sql = `SELECT * FROM equipment e WHERE ${clause || 'TRUE'} ${clause ? 'AND' : ''} e.is_deleted = false`;
 *   const rows = await pool.query(sql, [...params, false]);
 */
function buildScope(user, alias = '', paramOffset = 1) {
  const col = alias ? `${alias}.` : '';

  if (!user) return { clause: 'FALSE', params: [], offset: paramOffset };

  // Super admin and auditor see everything
  if ([ROLES.SUPER_ADMIN, ROLES.AUDITOR].includes(user.role)) {
    return { clause: '', params: [], offset: paramOffset };
  }

  // Base admin and Quartermaster see their entire base
  if ([ROLES.BASE_ADMIN, ROLES.QUARTERMASTER].includes(user.role)) {
    return {
      clause: `${col}home_base_id = $${paramOffset}`,
      params: [user.base_id],
      offset: paramOffset + 1,
    };
  }

  // Officer and Technician see their unit
  if ([ROLES.OFFICER, ROLES.TECHNICIAN].includes(user.role)) {
    return {
      clause: `${col}home_unit_id = $${paramOffset}`,
      params: [user.unit_id],
      offset: paramOffset + 1,
    };
  }

  // Soldier sees only their own checkouts — handled at service level, return base for now
  return {
    clause: `${col}home_base_id = $${paramOffset}`,
    params: [user.base_id],
    offset: paramOffset + 1,
  };
}

module.exports = { buildScope };
