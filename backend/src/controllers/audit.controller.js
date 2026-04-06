// ============================================================
// AUDIT CONTROLLER
// ============================================================
const auditService = require('../services/audit.service');
const { sendSuccess } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const result = await auditService.listLogs(req.query);
    sendSuccess(res, result);
  },

  async getById(req, res) {
    const { pool } = require('../config/database');
    const { rows } = await pool.query('SELECT * FROM audit_logs WHERE id = $1 LIMIT 1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Not found' });
    sendSuccess(res, rows[0]);
  },

  async entityHistory(req, res) {
    const { pool } = require('../config/database');
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE target_entity_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.params.entityId, limit, (page - 1) * limit]
    );
    sendSuccess(res, rows);
  },

  async anomalies(req, res) {
    const { pool } = require('../config/database');
    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE is_anomaly = true ORDER BY created_at DESC LIMIT 50`
    );
    sendSuccess(res, rows);
  },
};
