// ============================================================
// PAGINATION HELPER
// ============================================================

/**
 * Parse and validate pagination params from query string
 * @param {object} query - req.query
 * @returns {{ page, limit, offset }}
 */
function parsePagination(query) {
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build ORDER BY clause from query param
 * sortBy=name&order=asc → "ORDER BY name ASC"
 * Validates against an allowlist to prevent SQL injection
 * @param {object} query
 * @param {string[]} allowedFields
 * @param {string} defaultField
 */
function parseSort(query, allowedFields, defaultField = 'created_at') {
  const field  = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const order  = query.order === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${field} ${order}`;
}

module.exports = { parsePagination, parseSort };
