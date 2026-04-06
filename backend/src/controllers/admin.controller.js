// ============================================================
// ADMIN CONTROLLER — Full implementation
// ============================================================
const personnelService = require('../services/personnel.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');
const { pool } = require('../config/database');
const { redis } = require('../config/redis');
const logger = require('../config/logger');

module.exports = {
  // ── User management ─────────────────────────────────────────

  async listUsers(req, res) {
    const { search, role, base_id, is_active } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;
    if (search) {
      where += ` AND (p.full_name ILIKE $${i} OR p.service_number ILIKE $${i} OR p.email ILIKE $${i})`;
      params.push(`%${search}%`); i++;
    }
    if (role)     { where += ` AND p.role = $${i++}`;      params.push(role); }
    if (base_id)  { where += ` AND p.base_id = $${i++}`;   params.push(base_id); }
    if (is_active !== undefined) { where += ` AND p.is_active = $${i++}`; params.push(is_active === 'true'); }

    const { rows } = await pool.query(`
      SELECT p.id, p.service_number, p.full_name, p.email, p.role, p.rank,
             p.clearance_level, p.is_active, p.last_login_at, p.failed_login_count,
             p.locked_until, p.created_at,
             u.name AS unit_name, b.name AS base_name
      FROM personnel p
      LEFT JOIN units u ON u.id = p.unit_id
      LEFT JOIN bases b ON b.id = p.base_id
      ${where}
      ORDER BY p.created_at DESC
    `, params);
    sendSuccess(res, { data: rows });
  },

  async createUser(req, res) {
    const person = await personnelService.createPersonnel(req.body, req.user);
    sendCreated(res, person, 'User created');
  },

  async updateUser(req, res) {
    const { is_active, role, clearance_level } = req.body;
    const fields = [];
    const params = [req.params.id];
    let i = 2;
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`);       params.push(is_active); }
    if (role)                    { fields.push(`role = $${i++}`);             params.push(role); }
    if (clearance_level)         { fields.push(`clearance_level = $${i++}`);  params.push(clearance_level); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'Nothing to update' });
    const { rows } = await pool.query(
      `UPDATE personnel SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING id, full_name, role, is_active, clearance_level`,
      params
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    sendSuccess(res, rows[0], 'User updated');
  },

  async updateUserRole(req, res) {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Role required' });
    const { rows } = await pool.query(
      `UPDATE personnel SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING id, full_name, role`,
      [req.params.id, role]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    sendSuccess(res, rows[0], 'Role updated');
  },

  async deactivateUser(req, res) {
    const person = await personnelService.toggleActive(req.params.id, false);
    sendSuccess(res, person, 'User deactivated');
  },

  async unlockUser(req, res) {
    const { rows } = await pool.query(
      `UPDATE personnel SET failed_login_count = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, full_name`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    sendSuccess(res, rows[0], 'Account unlocked');
  },

  // ── Bases management ─────────────────────────────────────────

  async listBases(req, res) {
    const { rows } = await pool.query(`
      SELECT b.*,
        co.full_name AS co_name,
        (SELECT COUNT(*) FROM units u WHERE u.base_id = b.id AND u.is_active = true) AS unit_count,
        (SELECT COUNT(*) FROM personnel p WHERE p.base_id = b.id AND p.is_active = true) AS personnel_count,
        (SELECT COUNT(*) FROM equipment e WHERE e.home_base_id = b.id AND e.is_deleted = false) AS equipment_count
      FROM bases b
      LEFT JOIN personnel co ON co.id = b.commanding_officer_id
      ORDER BY b.name
    `);
    sendSuccess(res, { data: rows });
  },

  async createBase(req, res) {
    const { name, code, latitude, longitude, address, commanding_officer_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO bases (name, code, latitude, longitude, address, commanding_officer_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, code, latitude, longitude, address, commanding_officer_id || null]
    );
    logger.info('Base created', { name, by: req.user.id });
    sendCreated(res, rows[0], 'Base created');
  },

  async updateBase(req, res) {
    const { name, latitude, longitude, address, commanding_officer_id, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE bases SET name=$2, latitude=$3, longitude=$4, address=$5,
       commanding_officer_id=$6, is_active=$7, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, name, latitude, longitude, address, commanding_officer_id || null, is_active ?? true]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Base not found' });
    sendSuccess(res, rows[0], 'Base updated');
  },

  // ── System stats ─────────────────────────────────────────────

  async systemStats(req, res) {
    const [eq, pers, alerts, checkouts, audits, dbSize, units] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM equipment WHERE is_deleted = false`),
      pool.query(`SELECT COUNT(*) FROM personnel WHERE is_active = true`),
      pool.query(`SELECT COUNT(*) FROM alerts WHERE status = 'OPEN'`),
      pool.query(`SELECT COUNT(*) FROM checkout_records WHERE status = 'ACTIVE'`),
      pool.query(`SELECT COUNT(*) FROM audit_logs`),
      pool.query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`),
      pool.query(`SELECT COUNT(*) FROM units WHERE is_active = true`),
    ]);

    // Test Redis
    let redisOk = false;
    try { await redis.ping(); redisOk = true; } catch (_) {}

    const mem  = process.memoryUsage();
    const upMs = process.uptime() * 1000;
    const hrs  = Math.floor(upMs / 3_600_000);
    const mins = Math.floor((upMs % 3_600_000) / 60_000);

    sendSuccess(res, {
      total_equipment:    parseInt(eq.rows[0].count),
      total_personnel:    parseInt(pers.rows[0].count),
      open_alerts:        parseInt(alerts.rows[0].count),
      active_checkouts:   parseInt(checkouts.rows[0].count),
      total_audit_logs:   parseInt(audits.rows[0].count),
      total_units:        parseInt(units.rows[0].count),
      db_size:            dbSize.rows[0].size,
      db_connected:       true,
      redis_connected:    redisOk,
      api_status:         'Healthy',
      node_version:       process.version,
      uptime:             `${hrs}h ${mins}m`,
      memory_used:        `${Math.round(mem.heapUsed / 1024 / 1024)} MB / ${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    });
  },
};
