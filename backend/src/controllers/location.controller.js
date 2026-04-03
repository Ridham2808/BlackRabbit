// ============================================================
// LOCATION CONTROLLER
// ============================================================
const locationService = require('../services/location.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async ping(req, res) {
    const record = await locationService.recordPing(req.body, req.user);
    sendCreated(res, record, 'Location recorded');
  },

  async livePositions(req, res) {
    const rows = await locationService.getLivePositions();
    sendSuccess(res, rows);
  },

  async equipmentTrack(req, res) {
    const hours = parseInt(req.query.hours) || 24;
    const rows  = await locationService.getEquipmentTrack(req.params.equipmentId, hours);
    sendSuccess(res, rows);
  },
};
