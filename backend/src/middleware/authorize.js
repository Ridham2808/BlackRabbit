// ============================================================
// AUTHORIZE MIDDLEWARE — RBAC (SECTION 4)
// ============================================================

const { ROLE_PERMISSIONS } = require('../constants/rolePermissions');
const auditService = require('../services/audit.service');
const logger = require('../config/logger');

/**
 * RBAC Factory — returns middleware to check for required permissions.
 * @param {...string} requiredPermissions 
 */
function authorize(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const userRole = user.role;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      // Check if user has ANY of the required permissions
      const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

      if (!hasPermission) {
        // Detailed Audit Log for unauthorized attempt
        await auditService.createLog({
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          performedBy: { 
            id:             user.id, 
            role:           user.role, 
            service_number: user.serviceNumber 
          },
          ip: req.ip,
          additionalContext: {
            endpoint:            req.originalUrl,
            method:              req.method,
            requiredPermissions: requiredPermissions,
            userRole:            userRole,
            userPermissions:     userPermissions // "maximum detail" as requested
          }
        });

        logger.warn('Forbidden access attempt', {
          userId: user.id,
          role:   userRole,
          path:   req.originalUrl,
        });

        // Generic error message to prevent information leakage
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      next();
    } catch (err) {
      logger.error('authorize middleware error', { error: err.message });
      return res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
}

module.exports = { authorize };
