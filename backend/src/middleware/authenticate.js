// ============================================================
// AUTHENTICATE MIDDLEWARE — verifies JWT access token
// ============================================================

require('dotenv').config();
const { jwtVerify } = require('jose');

const logger = require('../config/logger');

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || 'change_me_in_env');
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      const { payload: decoded } = await jwtVerify(token, getSecret(), { issuer: 'deas-api' });
      payload = decoded;
    } catch (err) {
      if (err.code === 'ERR_JWT_EXPIRED') {
        return res.status(401).json({ success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Attach user to request — snake_case for DB consistency
    req.user = {
      id:             payload.userId,
      role:           payload.role,
      base_id:        payload.base_id,
      unit_id:        payload.unit_id,
      clearance_level: payload.clearance_level,
      full_name:      payload.full_name,
      service_number: payload.service_number,
      email:          payload.email,
      sessionId:      payload.sessionId,
    };

    next();
  } catch (err) {
    logger.error('authenticate error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}

module.exports = { authenticate };
