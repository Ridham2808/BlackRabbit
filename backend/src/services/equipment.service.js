// ============================================================
// EQUIPMENT SERVICE
// ============================================================

const { pool }               = require('../config/database');
const { redis }              = require('../config/redis');
const { EQUIPMENT_QUERIES }  = require('../queries/equipment.queries');
const { buildScope }         = require('../utils/scopeBuilder');
const { generateQRCode }     = require('../utils/qrGenerator');
const { emitEquipmentStatusChanged, emitEquipmentCreated } = require('../events/emitters');
const { EQUIPMENT_STATUS }   = require('../constants/statusTypes');
const { AUDIT_ACTIONS }      = require('../constants/alertTypes');
const auditService           = require('./audit.service');
const logger                 = require('../config/logger');

const CACHE_TTL = 120; // 2 minutes

// ── list ──────────────────────────────────────────────────────

async function listEquipment(user, query) {
  const { page = 1, limit = 20, status, category_id, condition, search,
          base_id, unit_id, sort_by = 'created_at', sort_dir = 'desc' } = query;

  const { clause: scopeWhere, params: scopeParams } = buildScope(user, 'e', 1);
  let paramIndex = scopeParams.length + 1;
  const params   = [...scopeParams];
  let where      = scopeWhere ? `AND ${scopeWhere}` : '';

  if (status)      { where += ` AND e.status = $${paramIndex++}`;      params.push(status); }
  if (category_id) { where += ` AND e.category_id = $${paramIndex++}`; params.push(category_id); }
  if (condition)   { where += ` AND e.condition = $${paramIndex++}`;   params.push(condition); }
  if (base_id)     { where += ` AND e.home_base_id = $${paramIndex++}`;params.push(base_id); }
  if (unit_id)     { where += ` AND e.home_unit_id = $${paramIndex++}`;params.push(unit_id); }
  if (search) {
    where += ` AND (e.name ILIKE $${paramIndex} OR e.serial_number ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Whitelist sort columns
  const safeSortBy  = ['name','serial_number','status','created_at','next_maintenance_due'].includes(sort_by) ? sort_by : 'created_at';
  const safeSortDir = sort_dir === 'asc' ? 'ASC' : 'DESC';
  const offset      = (page - 1) * limit;

  const sql = `
    ${EQUIPMENT_QUERIES.LIST}
    ${where}
    ORDER BY e.${safeSortBy} ${safeSortDir}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const countSql = `
    SELECT COUNT(*) FROM equipment e
    LEFT JOIN equipment_categories ec ON ec.id = e.category_id
    LEFT JOIN bases b ON b.id = e.home_base_id
    WHERE e.is_deleted = false ${where.replace(/AND e\./g, 'AND e.').replace(/AND \(e\./g, 'AND (e.')}
  `;
  // Use a simpler count query to avoid join issues
  const countParams = params.slice(0, params.length - 2);
  const simpleCnt = `SELECT COUNT(*) FROM equipment e WHERE e.is_deleted = false ${where}`;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(sql, params),
    pool.query(simpleCnt, countParams),
  ]);

  return {
    data:       rows,
    pagination: { page, limit, total: parseInt(countRows[0].count), pages: Math.ceil(countRows[0].count / limit) },
  };
}

// ── getById ───────────────────────────────────────────────────

async function getEquipmentById(id) {
  const cacheKey = `equipment:${id}`;
  const cached   = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  const { rows } = await pool.query(EQUIPMENT_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });

  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(rows[0])).catch(() => {});
  return rows[0];
}

// ── getBySerial ───────────────────────────────────────────────

async function getBySerial(serial) {
  const { rows } = await pool.query(EQUIPMENT_QUERIES.GET_BY_SERIAL, [serial]);
  if (!rows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });
  return rows[0];
}

// ── create ────────────────────────────────────────────────────

async function createEquipment(data, createdBy) {
  const {
    serial_number, name, category_id, description, manufacturer, model_number,
    purchase_date, purchase_price, condition, home_base_id, home_unit_id,
    tags, specifications, images, notes,
  } = data;

  const { rows } = await pool.query(EQUIPMENT_QUERIES.CREATE, [
    serial_number, name, category_id, description, manufacturer, model_number,
    purchase_date, purchase_price,
    EQUIPMENT_STATUS.OPERATIONAL, condition || 'GOOD',
    home_base_id, home_unit_id,
    tags ? `{${tags.join(',')}}` : null,
    JSON.stringify(specifications || {}),
    images ? `{${images.join(',')}}` : null,
    notes, createdBy.id,
  ]);

  const equipment = rows[0];

  // Generate QR code asynchronously
  generateQRCode(equipment.id, equipment.serial_number)
    .then(url => pool.query(EQUIPMENT_QUERIES.UPDATE_QR_URL, [equipment.id, url]))
    .catch(err => logger.warn('QR code generation failed', { error: err.message }));

  // Emit real-time event to the base
  emitEquipmentCreated(home_base_id, { id: equipment.id, name, serial_number, status: EQUIPMENT_STATUS.OPERATIONAL });

  return equipment;
}

// ── update ────────────────────────────────────────────────────

async function updateEquipment(id, data) {
  const { name, category_id, description, manufacturer, model_number, condition, tags, specifications, images, notes } = data;
  const { rows } = await pool.query(EQUIPMENT_QUERIES.UPDATE, [
    id, name, category_id, description, manufacturer, model_number, condition,
    tags ? `{${tags.join(',')}}` : null,
    JSON.stringify(specifications || {}),
    images ? `{${images.join(',')}}` : null,
    notes,
  ]);
  if (!rows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });
  await redis.del(`equipment:${id}`).catch(() => {});
  return rows[0];
}

// ── generateQR ────────────────────────────────────────────────

async function generateQR(id) {
  const equip = await getEquipmentById(id);
  const url   = await generateQRCode(equip.id, equip.serial_number);
  await pool.query(EQUIPMENT_QUERIES.UPDATE_QR_URL, [id, url]);
  return { qr_code_url: url };
}

// ── deleteEquipment ───────────────────────────────────────────

async function deleteEquipment(id) {
  const { rows } = await pool.query(EQUIPMENT_QUERIES.SOFT_DELETE, [id]);
  if (!rows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });
  await redis.del(`equipment:${id}`).catch(() => {});
  return rows[0];
}

// ── updateStatus (internal) ───────────────────────────────────

async function updateStatus(id, status, baseId) {
  const { rows } = await pool.query(EQUIPMENT_QUERIES.UPDATE_STATUS, [id, status]);
  await redis.del(`equipment:${id}`).catch(() => {});
  emitEquipmentStatusChanged(baseId, { id, status, serial: rows[0]?.serial_number });
  return rows[0];
}

// ── dashboardStats ────────────────────────────────────────────

async function getDashboardStats(baseId) {
  const { rows } = await pool.query(EQUIPMENT_QUERIES.COUNT_BY_STATUS_FOR_BASE, [baseId]);
  const stats = {};
  let total = 0;
  rows.forEach(r => { stats[r.status] = parseInt(r.count); total += parseInt(r.count); });
  return { ...stats, total };
}

module.exports = {
  listEquipment,
  getEquipmentById,
  getBySerial,
  createEquipment,
  updateEquipment,
  generateQR,
  deleteEquipment,
  updateStatus,
  getDashboardStats,
};
