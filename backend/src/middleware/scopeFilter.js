// ============================================================
// SCOPE FILTER MIDDLEWARE
// Injects row-level security filters based on user's role
// Must run AFTER authenticate middleware
// Controllers read req.scope to build WHERE clauses
// ============================================================

const ROLES = require('../constants/roles');

function scopeFilter(req, res, next) {
  if (!req.user) return next();

  const { role, baseId, unitId, id: userId } = req.user;

  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.AUDITOR:
      // Full access — no restrictions
      req.scope = { type: 'GLOBAL', baseId: null, unitId: null, userId: null };
      break;

    case ROLES.BASE_ADMIN:
    case ROLES.QUARTERMASTER:
      // Base-level scope — all data within their base
      req.scope = { type: 'BASE', baseId, unitId: null, userId: null };
      break;

    case ROLES.OFFICER:
      // Base-level read, unit-level write
      req.scope = { type: 'OFFICER', baseId, unitId, userId };
      break;

    case ROLES.TECHNICIAN:
      // Can only see equipment assigned to them
      req.scope = { type: 'TECHNICIAN', baseId, unitId, userId };
      break;

    case ROLES.SOLDIER:
    default:
      // Own data only
      req.scope = { type: 'SELF', baseId, unitId, userId };
      break;
  }

  next();
}

module.exports = scopeFilter;
