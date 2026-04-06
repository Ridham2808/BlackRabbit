// ============================================================
// SCOPE FILTER MIDDLEWARE — MULTI-TENANCY ISOLATION (SECTION 4)
// ============================================================

const logger = require('../config/logger');

/**
 * After authentication, injects req.scope to filter queries.
 * Based on user role as specified in requirements.
 */
module.exports = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return next(); // Should be caught by authenticate

    const { role, id, baseId, unitId } = user;
    let scope = {};

    switch (role) {
      case 'SOLDIER':
        // Only own data — locked to their personnelId
        scope = { baseId, unitId, personnelId: id };
        break;

      case 'SERGEANT':
        // Sees all personnel in their unit, but not officer-level data
        scope = { baseId, unitId, sergeantId: id };
        break;

      case 'OFFICER':
        // Sees full base data
        scope = { baseId };
        break;

      case 'QUARTERMASTER':
      case 'BASE_ADMIN':
        scope = { baseId };
        break;

      case 'AUDITOR':
      case 'SYSTEM_ADMIN':
      case 'SUPER_ADMIN':
        scope = {}; // No restrictions
        break;

      default:
        // Default to most restrictive if unknown role
        scope = { personnelId: id };
        break;
    }

    req.scope = scope;
    next();
  } catch (err) {
    logger.error('scopeFilter middleware error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Scope processing error' });
  }
};
