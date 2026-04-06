// ============================================================
// OFFICER CONTROLLER — Admin panel + command management
// ============================================================

const bcrypt       = require('bcrypt');
const { pool }     = require('../config/database');
const { sendSuccess } = require('../utils/responseFormatter');
const { catchAsync }  = require('../utils/catchAsync');
const emailService    = require('../services/email.service');
const logger          = require('../config/logger');

// ── Utilities ─────────────────────────────────────────────────

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

function generateBadgeNumber(role) {
  const prefix = { SERGEANT: 'SGT', SOLDIER: 'SLD', OFFICER: 'OFF' }[role] || 'USR';
  const num = String(Math.floor(1000 + Math.random() * 8999)).padStart(4, '0');
  return `${prefix}-${num}`;
}

function generateServiceNumber(role) {
  const year = new Date().getFullYear();
  const suffix = String(Math.floor(1000 + Math.random() * 8999));
  const prefix = { SERGEANT: 'SGT', SOLDIER: 'SLD', OFFICER: 'OFF' }[role] || 'PER';
  return `${prefix}-${year}-${suffix}`;
}

// ── Create Sergeant ──────────────────────────────────────────
const createSergeant = catchAsync(async (req, res) => {
  const { fullName, email, phone, rank, unitId, baseId } = req.body;

  if (!fullName || !email || !unitId || !baseId) {
    return res.status(400).json({ success: false, message: 'fullName, email, unitId, baseId required' });
  }

  const password     = generatePassword();
  const badgeNumber  = generateBadgeNumber('SERGEANT');
  const serviceNumber= generateServiceNumber('SERGEANT');
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(`
    INSERT INTO personnel (
      service_number, full_name, email, phone, password_hash, role, rank,
      badge_number, unit_id, base_id, clearance_level, token_version,
      assigned_officer_id, created_by
    ) VALUES ($1,$2,$3,$4,$5,'SERGEANT',$6,$7,$8,$9,2,1,$10,$11)
    RETURNING id, service_number, full_name, email, role, rank, badge_number, unit_id, base_id
  `, [
    serviceNumber, fullName, email, phone || null, passwordHash,
    rank || 'Sergeant', badgeNumber, unitId, baseId,
    req.user.id, req.user.id
  ]);

  const sergeant = rows[0];

  // Send credentials email (non-blocking)
  emailService.sendCredentials({
    to:            email,
    fullName,
    role:          'SERGEANT',
    serviceNumber,
    password,
    badgeNumber,
    baseUrl:       process.env.APP_BASE_URL || 'http://localhost:5173',
  }).catch(err => logger.error('Failed to send sergeant credentials email', { err: err.message }));

  sendSuccess(res, { sergeant, credentialsSent: true }, 'Sergeant account created successfully');
});

// ── Create Soldier ───────────────────────────────────────────
const createSoldier = catchAsync(async (req, res) => {
  const { fullName, email, phone, rank, unitId, baseId, assignedSergeantId } = req.body;

  if (!fullName || !email || !unitId || !baseId) {
    return res.status(400).json({ success: false, message: 'fullName, email, unitId, baseId required' });
  }

  const password     = generatePassword();
  const badgeNumber  = generateBadgeNumber('SOLDIER');
  const serviceNumber= generateServiceNumber('SOLDIER');
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(`
    INSERT INTO personnel (
      service_number, full_name, email, phone, password_hash, role, rank,
      badge_number, unit_id, base_id, clearance_level, token_version,
      assigned_sergeant_id, created_by
    ) VALUES ($1,$2,$3,$4,$5,'SOLDIER',$6,$7,$8,$9,1,1,$10,$11)
    RETURNING id, service_number, full_name, email, role, rank, badge_number, unit_id, base_id, assigned_sergeant_id
  `, [
    serviceNumber, fullName, email, phone || null, passwordHash,
    rank || 'Private', badgeNumber, unitId, baseId,
    assignedSergeantId || null, req.user.id
  ]);

  const soldier = rows[0];

  emailService.sendCredentials({
    to:            email,
    fullName,
    role:          'SOLDIER',
    serviceNumber,
    password,
    badgeNumber,
    baseUrl:       process.env.APP_BASE_URL || 'http://localhost:5173',
  }).catch(err => logger.error('Failed to send soldier credentials email', { err: err.message }));

  sendSuccess(res, { soldier, credentialsSent: true }, 'Soldier account created successfully');
});

// ── Get All Sergeants ────────────────────────────────────────
const getAllSergeants = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      p.id, p.service_number, p.full_name, p.email, p.role, p.rank, p.badge_number,
      p.is_active, p.last_login_at, p.created_at,
      u.name as unit_name, u.code as unit_code,
      b.name as base_name,
      COUNT(s.id) as soldiers_count
    FROM personnel p
    LEFT JOIN units u ON p.unit_id = u.id
    LEFT JOIN bases b ON p.base_id = b.id
    LEFT JOIN personnel s ON s.assigned_sergeant_id = p.id AND s.is_deleted = false
    WHERE p.role = 'SERGEANT'
      AND p.base_id = $1
      AND p.is_deleted = false
    GROUP BY p.id, u.name, u.code, b.name
    ORDER BY p.full_name ASC
  `, [req.user.baseId]);

  sendSuccess(res, rows, 'Sergeants retrieved');
});

// ── Get Sergeant by ID ───────────────────────────────────────
const getSergeantById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rows: sgtRows } = await pool.query(`
    SELECT p.*, u.name as unit_name, b.name as base_name
    FROM personnel p
    LEFT JOIN units u ON p.unit_id = u.id
    LEFT JOIN bases b ON p.base_id = b.id
    WHERE p.id = $1 AND p.role = 'SERGEANT' AND p.is_deleted = false
  `, [id]);

  if (!sgtRows[0]) return res.status(404).json({ success: false, message: 'Sergeant not found' });

  const { rows: soldiers } = await pool.query(`
    SELECT id, service_number, full_name, rank, badge_number, is_active, last_login_at
    FROM personnel
    WHERE assigned_sergeant_id = $1 AND is_deleted = false
    ORDER BY full_name ASC
  `, [id]);

  sendSuccess(res, { ...sgtRows[0], soldiers }, 'Sergeant retrieved');
});

// ── Get All Soldiers ─────────────────────────────────────────
const getAllSoldiers = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      p.id, p.service_number, p.full_name, p.email, p.role, p.rank, p.badge_number,
      p.is_active, p.last_login_at, p.created_at,
      u.name as unit_name, b.name as base_name,
      sgt.full_name as sergeant_name, sgt.badge_number as sergeant_badge
    FROM personnel p
    LEFT JOIN units u ON p.unit_id = u.id
    LEFT JOIN bases b ON p.base_id = b.id
    LEFT JOIN personnel sgt ON sgt.id = p.assigned_sergeant_id
    WHERE p.role = 'SOLDIER'
      AND p.base_id = $1
      AND p.is_deleted = false
    ORDER BY p.full_name ASC
  `, [req.user.baseId]);

  sendSuccess(res, rows, 'Soldiers retrieved');
});

// ── Get Soldier by ID ────────────────────────────────────────
const getSoldierById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(`
    SELECT 
      p.*, u.name as unit_name, b.name as base_name,
      sgt.full_name as sergeant_name, sgt.badge_number as sergeant_badge,
      (SELECT json_agg(cr ORDER BY cr.actual_checkout_at DESC)
       FROM checkout_records cr WHERE cr.checked_out_by_id = p.id) as checkout_history
    FROM personnel p
    LEFT JOIN units u ON p.unit_id = u.id
    LEFT JOIN bases b ON p.base_id = b.id
    LEFT JOIN personnel sgt ON sgt.id = p.assigned_sergeant_id
    WHERE p.id = $1 AND p.role = 'SOLDIER' AND p.is_deleted = false
  `, [id]);

  if (!rows[0]) return res.status(404).json({ success: false, message: 'Soldier not found' });
  sendSuccess(res, rows[0], 'Soldier retrieved');
});

// ── Assign Sergeant to Soldier ───────────────────────────────
const assignSergeant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { sergeantId } = req.body;

  await pool.query(`
    UPDATE personnel SET assigned_sergeant_id = $1 WHERE id = $2 AND role = 'SOLDIER'
  `, [sergeantId || null, id]);

  sendSuccess(res, null, 'Sergeant assignment updated');
});

// ── List Bases ───────────────────────────────────────────────
const listBases = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`SELECT id, name, code FROM bases WHERE is_active = true ORDER BY name`);
  sendSuccess(res, rows, 'Bases retrieved');
});

// ── List Units ───────────────────────────────────────────────
const listUnits = catchAsync(async (req, res) => {
  const baseId = req.query.baseId;
  const query  = baseId
    ? `SELECT id, name, code, base_id FROM units WHERE is_active = true AND base_id = $1 ORDER BY name`
    : `SELECT id, name, code, base_id FROM units WHERE is_active = true ORDER BY name`;
  const { rows } = await pool.query(query, baseId ? [baseId] : []);
  sendSuccess(res, rows, 'Units retrieved');
});

module.exports = {
  createSergeant,
  createSoldier,
  getAllSergeants,
  getSergeantById,
  getAllSoldiers,
  getSoldierById,
  assignSergeant,
  listBases,
  listUnits,
};
