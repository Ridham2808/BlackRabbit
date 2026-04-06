// ============================================================
// AUTHENTICATE MIDDLEWARE — JWT (SECTION 4)
// ============================================================

const jwt = require('jsonwebtoken');
const auditService = require('../services/audit.service');
const logger = require('../config/logger');

/**
 * Verifies the Bearer JWT in Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer:   'defence-asset-system',
        audience: 'deas-clients',
      });

      // Attach user info to request
      // Provide both camelCase and snake_case for maximum compatibility across services
      req.user = {
        id:             decoded.sub,
        role:           decoded.role,
        baseId:         decoded.baseId,
        base_id:        decoded.baseId,
        unitId:         decoded.unitId,
        unit_id:        decoded.unitId,
        serviceNumber:  decoded.serviceNumber,
        service_number: decoded.serviceNumber,
        clearanceLevel: decoded.clearanceLevel,
        clearance_level:decoded.clearanceLevel,
        fullName:       decoded.fullName,
        full_name:      decoded.fullName
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Access token expired', 
          code: 'TOKEN_EXPIRED' 
        });
      }

      // Log unauthorized access attempt for other invalid reasons
      await auditService.createLog({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        performedBy: null, // User is unknown here
        ip: req.ip,
        additionalContext: { 
          endpoint: req.originalUrl,
          method:   req.method,
          error:    err.message 
        }
      });

      return res.status(401).json({ success: false, message: 'Invalid or forged token' });
    }
  } catch (err) {
    logger.error('authenticate middleware error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Authentication internal error' });
  }
};

module.exports = { authenticate };
