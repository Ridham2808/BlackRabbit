// ============================================================
// TOKEN GENERATOR — JWT with jose, matching authenticate.js payload shape
// ============================================================

const { SignJWT, jwtVerify } = require('jose');

function getSecret(envKey) {
  const val = process.env[envKey] || 'change_me_in_env';
  return new TextEncoder().encode(val);
}

async function generateAccessToken(user) {
  // user = { id, role, base_id, unit_id, clearance_level, full_name, service_number, email, sessionId }
  return new SignJWT({
    userId:          user.id,
    role:            user.role,
    base_id:         user.base_id,
    unit_id:         user.unit_id,
    clearance_level: user.clearance_level,
    full_name:       user.full_name,
    service_number:  user.service_number,
    email:           user.email,
    sessionId:       user.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setIssuer('deas-api')
    .sign(getSecret('JWT_ACCESS_SECRET'));
}

async function generateRefreshToken({ userId, sessionId }) {
  return new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer('deas-api')
    .sign(getSecret('JWT_REFRESH_SECRET'));
}

async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, getSecret('JWT_ACCESS_SECRET'), { issuer: 'deas-api' });
  return payload;
}

async function verifyRefreshToken(token) {
  const { payload } = await jwtVerify(token, getSecret('JWT_REFRESH_SECRET'), { issuer: 'deas-api' });
  return payload;
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
