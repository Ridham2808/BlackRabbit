// ============================================================
// AUTH CONTROLLER — SECTION 4 IMPLEMENTATION
// ============================================================

const { pool } = require('../config/database');
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/responseFormatter');
const { catchAsync } = require('../utils/catchAsync');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path:     '/',
  maxAge:   90 * 24 * 60 * 60 * 1000, // 90 days
};

module.exports = {
  /**
   * POST /api/auth/login
   */
  login: catchAsync(async (req, res) => {
    const { serviceNumber, password, deviceInfo } = req.body;
    
    const result = await authService.login({
      serviceNumber,
      password,
      deviceInfo,
      ip: req.ip,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);

    // Return success without password, optionally return refresh token for mobile clients
    sendSuccess(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      personnel:   result.personnel,
      permissions: result.permissions,
      sessionId:   result.sessionId
    }, 'Login successful');
  }),

  /**
   * POST /api/auth/refresh
   */
  refresh: catchAsync(async (req, res) => {
    // Read from cookie or body (frontend should use cookie)
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const { sessionId } = req.body;

    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { accessToken } = await authService.refresh(token, sessionId, req.ip);
    
    sendSuccess(res, { accessToken }, 'Token refreshed');
  }),

  /**
   * POST /api/auth/logout
   */
  logout: catchAsync(async (req, res) => {
    const { sessionId } = req.body || req.user; // sessionId could come from token or body
    const userId = req.user.id;

    await authService.logout(userId, sessionId, req.ip);
    
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    sendSuccess(res, null, 'Logged out successfully');
  }),

  /**
   * POST /api/auth/logout-all-sessions
   */
  logoutAllSessions: catchAsync(async (req, res) => {
    const userId = req.user.id;
    await authService.logoutAllSessions(userId, req.ip);
    
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    sendSuccess(res, null, 'Logged out from all sessions');
  }),

  /**
   * GET /api/auth/me
   */
  me: catchAsync(async (req, res) => {
    // Enrich with badge number & hierarchy info
    const { rows } = await pool.query(`
      SELECT p.*, u.name as unit_name, b.name as base_name,
        sgt.full_name as sergeant_name, sgt.badge_number as sergeant_badge,
        off.full_name as officer_name, off.badge_number as officer_badge
      FROM personnel p
      LEFT JOIN units u ON u.id = p.unit_id
      LEFT JOIN bases b ON b.id = p.base_id
      LEFT JOIN personnel sgt ON sgt.id = p.assigned_sergeant_id
      LEFT JOIN personnel off ON off.id = p.assigned_officer_id
      WHERE p.id = $1 AND p.is_deleted = false
    `, [req.user.id]);
    const { password_hash, refresh_token_hash, ...safe } = rows[0] || {};
    sendSuccess(res, safe, 'User profile fetched');
  }),

  /**
   * POST /api/auth/officer-signup
   */
  officerSignup: catchAsync(async (req, res) => {
    const bcrypt = require('bcrypt');
    const { v4: uuid } = require('uuid');
    const { fullName, email, password, secretCode, baseId, unitId, rank, phone } = req.body;

    // Validate secret code
    const validCode = process.env.OFFICER_SECRET_CODE || 'DEAS-OFFICER-2024';
    if (secretCode !== validCode) {
      return res.status(403).json({ success: false, message: 'Invalid officer registration code' });
    }

    if (!fullName || !email || !password || !baseId) {
      return res.status(400).json({ success: false, message: 'fullName, email, password, baseId required' });
    }

    // Check duplicate email
    const { rows: existing } = await pool.query(
      `SELECT id FROM personnel WHERE email = $1 AND is_deleted = false`, [email]
    );
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const year = new Date().getFullYear();
    const suffix = String(Math.floor(1000 + Math.random() * 8999));
    const serviceNumber = `OFF-${year}-${suffix}`;
    const badgeNum = String(Math.floor(1000 + Math.random() * 8999));
    const badgeNumber = `OFF-${badgeNum}`;

    const { rows } = await pool.query(`
      INSERT INTO personnel (
        service_number, full_name, email, phone, password_hash, role, rank,
        badge_number, unit_id, base_id, clearance_level, token_version
      ) VALUES ($1,$2,$3,$4,$5,'OFFICER',$6,$7,$8,$9,3,1)
      RETURNING id, service_number, full_name, email, role, rank, badge_number, unit_id, base_id
    `, [serviceNumber, fullName, email, phone || null, passwordHash, rank || 'Lieutenant', badgeNumber, unitId || null, baseId]);

    const personnel = rows[0];
    const sessionId = uuid();
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign(
      { sub: personnel.id, role: 'OFFICER', baseId: personnel.base_id, unitId: personnel.unit_id, serviceNumber: personnel.service_number, clearanceLevel: 3 },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m', issuer: 'defence-asset-system', audience: 'deas-clients' }
    );
    const refreshToken = jwt.sign(
      { sub: personnel.id, tokenVersion: 1 },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    sendSuccess(res, { accessToken, refreshToken, personnel, sessionId, permissions: require('../constants/rolePermissions').ROLE_PERMISSIONS['OFFICER'] || [] }, 'Officer account created successfully');
  }),

  /**
   * GET /api/auth/bases
   */
  getBases: catchAsync(async (req, res) => {
    const { rows } = await pool.query(`SELECT id, name, code FROM bases WHERE is_active = true ORDER BY name`);
    sendSuccess(res, rows, 'Bases retrieved');
  }),

  /**
   * GET /api/auth/units
   */
  getUnits: catchAsync(async (req, res) => {
    const { baseId } = req.query;
    const q = baseId
      ? `SELECT id, name, code, base_id FROM units WHERE is_active = true AND base_id = $1 ORDER BY name`
      : `SELECT id, name, code, base_id FROM units WHERE is_active = true ORDER BY name`;
    const { rows } = await pool.query(q, baseId ? [baseId] : []);
    sendSuccess(res, rows, 'Units retrieved');
  }),

};
