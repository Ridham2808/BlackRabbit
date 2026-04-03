// ============================================================
// AUTH SERVICE — JWT two-token strategy with Redis session
// ============================================================

const bcrypt       = require('bcrypt');
const { v4: uuid } = require('uuid');
const { pool }     = require('../config/database');
const { redis }    = require('../config/redis');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenGenerator');
const { AUTH_QUERIES } = require('../queries/auth.queries');
const logger           = require('../config/logger');

const MAX_FAILED_LOGINS   = 5;
const LOCKOUT_MINUTES     = 30;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ── login ────────────────────────────────────────────────────

async function login({ email, password, deviceToken, deviceType, ip, requestId }) {
  const { rows } = await pool.query(AUTH_QUERIES.FIND_BY_EMAIL, [email]);
  const user = rows[0];

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }

  if (!user.is_active) {
    throw Object.assign(new Error('Account deactivated'), { statusCode: 403, code: 'ACCOUNT_DEACTIVATED' });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw Object.assign(new Error(`Account locked until ${user.locked_until}`), { statusCode: 429, code: 'ACCOUNT_LOCKED' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const { rows: failRows } = await pool.query(AUTH_QUERIES.INCREMENT_FAILED_LOGIN, [user.id]);
    const failCount = failRows[0].failed_login_count;

    if (failCount >= MAX_FAILED_LOGINS) {
      await pool.query(AUTH_QUERIES.LOCK_ACCOUNT, [user.id, LOCKOUT_MINUTES]);
      logger.warn('Account locked after failed logins', { userId: user.id, ip });
    }

    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }

  // Clear failed login count on success
  await pool.query(AUTH_QUERIES.UPDATE_LOGIN_SUCCESS, [user.id]);

  // Store device token if provided
  if (deviceToken) {
    await pool.query(AUTH_QUERIES.STORE_DEVICE_TOKEN, [user.id, deviceToken]);
  }

  // Get full user details
  const { rows: fullRows } = await pool.query(AUTH_QUERIES.FIND_BY_ID, [user.id]);
  const fullUser = fullRows[0];

  // Generate tokens
  const sessionId    = uuid();
  const accessToken  = await generateAccessToken({ ...fullUser, sessionId });
  const refreshToken = await generateRefreshToken({ userId: fullUser.id, sessionId });


  return { accessToken, refreshToken, sessionId, user: sanitizeUser(fullUser) };
}

// ── refresh ───────────────────────────────────────────────────

async function refresh(token) {
  let payload;
  try {
    payload = await verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401, code: 'INVALID_TOKEN' });
  }

  const { userId, sessionId } = payload;
  const redisKey = `refresh:${userId}:${sessionId}`;
  const stored   = await redis.get(redisKey);

  if (!stored || stored !== token) {
    throw Object.assign(new Error('Refresh token revoked'), { statusCode: 401, code: 'TOKEN_REVOKED' });
  }

  const newSessionId   = uuid();
  const newAccessToken = await generateAccessToken({ userId, role: payload.role, sessionId: newSessionId });
  const newRefreshToken= await generateRefreshToken({ userId, sessionId: newSessionId });

  // Rotate: delete old, store new
  await redis.del(redisKey);
  await redis.setEx(`refresh:${userId}:${newSessionId}`, REFRESH_TTL_SECONDS, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ── logout ────────────────────────────────────────────────────

async function logout(userId, sessionId) {
  const redisKey = `refresh:${userId}:${sessionId}`;
  await redis.del(redisKey);
}

// ── helpers ───────────────────────────────────────────────────

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, refresh_token_hash, biometric_token_hash, ...safe } = user;
  return safe;
}

async function getMe(userId) {
  const { rows } = await pool.query(AUTH_QUERIES.FIND_BY_ID, [userId]);
  return sanitizeUser(rows[0]);
}

module.exports = { login, refresh, logout, getMe };
