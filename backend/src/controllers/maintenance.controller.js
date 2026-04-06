// ============================================================
// MAINTENANCE CONTROLLER
// ============================================================
const maintenanceService = require('../services/maintenance.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const rows = await maintenanceService.listMaintenance(req.query);
    sendSuccess(res, rows);
  },

  async getById(req, res) {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    sendSuccess(res, record);
  },

  async schedule(req, res) {
    const record = await maintenanceService.scheduleMaintenance(req.body, req.user);
    sendCreated(res, record, 'Maintenance scheduled');
  },

  async start(req, res) {
    const record = await maintenanceService.startMaintenance(req.params.id, req.user);
    sendSuccess(res, record, 'Maintenance started');
  },

  async complete(req, res) {
    const record = await maintenanceService.completeMaintenance(req.params.id, req.body, req.user);
    sendSuccess(res, record, 'Maintenance completed');
  },
};
