// ============================================================
// SYNC CONTROLLER — Offline queue processing
// ============================================================
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/responseFormatter');
const checkoutService = require('../services/checkout.service');
const locationService = require('../services/location.service');
const auditService    = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../constants/alertTypes');

module.exports = {
  async processQueue(req, res) {
    const { actions } = req.body; // Array of { type, payload, clientTimestamp }
    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ success: false, message: 'No actions to sync' });
    }

    const results = [];
    for (const action of actions) {
      try {
        let result;
        if (action.type === 'CHECKOUT')       result = await checkoutService.checkout(action.payload, req.user);
        else if (action.type === 'CHECKIN')   result = await checkoutService.checkIn(action.payload.checkoutId, action.payload, req.user);
        else if (action.type === 'LOCATION_PING') result = await locationService.recordPing(action.payload, req.user);
        results.push({ type: action.type, success: true, data: result });
      } catch (err) {
        results.push({ type: action.type, success: false, error: err.message });
      }
    }

    auditService.createLog({
      action: AUDIT_ACTIONS.OFFLINE_SYNC_COMPLETED,
      performedBy: req.user,
      additionalContext: { total: actions.length, success: results.filter(r => r.success).length },
    });

    sendSuccess(res, { processed: results.length, results });
  },

  async getQueueStatus(req, res) {
    const { rows } = await pool.query(
      `SELECT * FROM offline_sync_queue WHERE personnel_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    sendSuccess(res, rows);
  },
};
