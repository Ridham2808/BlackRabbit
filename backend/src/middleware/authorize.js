// ============================================================
// AUTHORIZE MIDDLEWARE — RBAC permission check
// Usage: authorize('equipment:checkout', 'equipment:create')
// Passes if user has ANY ONE of the listed permissions
// ============================================================

const { hasAnyPermission } = require('../constants/rolePermissions');
const { AUDIT_ACTIONS } = require('../constants/alertTypes');
const { DEVICE_TYPE } = require('../constants/statusTypes');
const logger = require('../config/logger');

/**
 * Factory — returns middleware that checks for any of the given permissions
 * @param {...string} requiredPermissions
 */
function authorize(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const { role, id: userId, baseId, fullName, serviceNumber } = req.user;

      // SUPER_ADMIN bypasses all permission checks
      if (role === 'SUPER_ADMIN') return next();

      const allowed = hasAnyPermission(role, requiredPermissions);

      if (!allowed) {
        // Log unauthorized access attempt to audit
        try {
          const { query } = require('../config/database');
          await query(
            `INSERT INTO audit_logs
              (action, performed_by_id, performed_by_name, performed_by_role,
               performed_by_service_number, target_entity_type,
               ip_address, user_agent, device_type, severity, additional_context)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'CRITICAL',$10)`,
            [
              AUDIT_ACTIONS.UNAUTHORIZED_ACCESS_ATTEMPT,
              userId, fullName, role, serviceNumber,
              'SYSTEM',
              req.ip,
              req.headers['user-agent'],
              req.headers['x-device-type'] || DEVICE_TYPE.WEB,
              JSON.stringify({
                attempted_path:        req.originalUrl,
                method:                req.method,
                required_permissions:  requiredPermissions,
                user_role:             role,
              }),
            ]
          );
        } catch (auditErr) {
          logger.error('Failed to write unauthorized access audit', { error: auditErr.message });
        }

        logger.warn('Access denied', {
          userId, role,
          path:                req.originalUrl,
          required_permissions: requiredPermissions,
          ip:                  req.ip,
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }

      next();
    } catch (err) {
      logger.error('authorize middleware error', { error: err.message });
      return res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
}

module.exports = authorize;
