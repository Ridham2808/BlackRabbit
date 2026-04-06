// ============================================================
// PERSONNEL SERVICE
// ============================================================

const bcrypt              = require('bcrypt');
const { pool }            = require('../config/database');
const { PERSONNEL_QUERIES } = require('../queries/personnel.queries');

const SALT_ROUNDS = 12;

async function listPersonnel(user, query = {}) {
  const { page = 1, limit = 20, role, base_id, unit_id, search, active } = query;
  let where  = '';
  let params = [];
  let pIdx   = 1;

  if (role)    { where += ` AND p.role = $${pIdx++}`;       params.push(role); }
  if (base_id) { where += ` AND p.base_id = $${pIdx++}`;    params.push(base_id); }
  if (unit_id) { where += ` AND p.unit_id = $${pIdx++}`;    params.push(unit_id); }
  if (active !== undefined) { where += ` AND p.is_active = $${pIdx++}`; params.push(active); }
  if (search) {
    where += ` AND (p.full_name ILIKE $${pIdx} OR p.service_number ILIKE $${pIdx} OR p.email ILIKE $${pIdx})`;
    params.push(`%${search}%`); pIdx++;
  }

  const offset = (page - 1) * limit;
  const sql    = `${PERSONNEL_QUERIES.LIST} ${where} ORDER BY p.full_name ASC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getPersonnelById(id) {
  const { rows } = await pool.query(PERSONNEL_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Personnel not found'), { statusCode: 404 });
  return rows[0];
}

async function createPersonnel(data, createdBy) {
  const { service_number, full_name, email, phone, password,
          role, rank, unit_id, base_id, clearance_level } = data;

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(PERSONNEL_QUERIES.CREATE, [
    service_number, full_name, email, phone, hash,
    role, rank, unit_id || null, base_id, clearance_level || 1, createdBy.id,
  ]);
  return rows[0];
}

async function updatePersonnel(id, data) {
  const { full_name, phone, rank, unit_id, base_id, clearance_level, avatar_url } = data;
  const { rows } = await pool.query(PERSONNEL_QUERIES.UPDATE, [
    id, full_name, phone, rank, unit_id, base_id, clearance_level, avatar_url,
  ]);
  if (!rows[0]) throw Object.assign(new Error('Personnel not found'), { statusCode: 404 });
  return rows[0];
}

async function toggleActive(id, isActive) {
  const { rows } = await pool.query(PERSONNEL_QUERIES.TOGGLE_ACTIVE, [id, isActive]);
  if (!rows[0]) throw Object.assign(new Error('Personnel not found'), { statusCode: 404 });
  return rows[0];
}

async function listBases() {
  const { rows } = await pool.query(PERSONNEL_QUERIES.BASES_LIST);
  return rows;
}

async function listUnits(baseId) {
  let sql    = PERSONNEL_QUERIES.UNITS_LIST;
  let params = [];
  if (baseId) { sql += ' WHERE u.base_id = $1'; params.push(baseId); }
  const { rows } = await pool.query(sql, params);
  return rows;
}

module.exports = { listPersonnel, getPersonnelById, createPersonnel, updatePersonnel, toggleActive, listBases, listUnits };
