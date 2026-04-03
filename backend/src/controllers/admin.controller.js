// ============================================================
// ADMIN CONTROLLER
// ============================================================
const personnelService = require('../services/personnel.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');
const { pool } = require('../config/database');

module.exports = {
  async createUser(req, res) {
    const person = await personnelService.createPersonnel(req.body, req.user);
    sendCreated(res, person, 'User created');
  },

  async updateUserRole(req, res) {
    const { rows } = await pool.query(
      `UPDATE personnel SET role = $2 WHERE id = $1 RETURNING id, full_name, role`,
      [req.params.id, req.body.role]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    sendSuccess(res, rows[0], 'Role updated');
  },

  async deactivateUser(req, res) {
    const person = await personnelService.toggleActive(req.params.id, false);
    sendSuccess(res, person, 'User deactivated');
  },

  async systemStats(req, res) {
    const [eq, pers, alerts, checkouts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM equipment WHERE is_deleted = false'),
      pool.query('SELECT COUNT(*) FROM personnel WHERE is_deleted = false AND is_active = true'),
      pool.query(`SELECT COUNT(*) FROM alerts WHERE status = 'OPEN'`),
      pool.query(`SELECT COUNT(*) FROM checkout_records WHERE status = 'ACTIVE'`),
    ]);
    sendSuccess(res, {
      equipment:        parseInt(eq.rows[0].count),
      active_personnel: parseInt(pers.rows[0].count),
      open_alerts:      parseInt(alerts.rows[0].count),
      active_checkouts: parseInt(checkouts.rows[0].count),
    });
  },
};
