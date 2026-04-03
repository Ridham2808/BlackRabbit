// ============================================================
// ALERT CONTROLLER
// ============================================================
const alertService = require('../services/alert.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const rows = await alertService.listAlerts({ ...req.query, baseId: req.user.base_id });
    sendSuccess(res, rows);
  },

  async acknowledge(req, res) {
    const alert = await alertService.acknowledgeAlert(req.params.id, req.user);
    sendSuccess(res, alert, 'Alert acknowledged');
  },

  async resolve(req, res) {
    const alert = await alertService.resolveAlert(req.params.id, req.user, req.body.resolution_notes);
    sendSuccess(res, alert, 'Alert resolved');
  },

  async dismiss(req, res) {
    const alert = await alertService.dismissAlert(req.params.id, req.user);
    sendSuccess(res, alert, 'Alert dismissed');
  },
};
