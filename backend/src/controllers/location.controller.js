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

  // Latest known position for every checked-out piece of equipment (used by LiveMap)
  async latest(req, res) {
    const rows = await locationService.getLatestPositions(req.user.base_id);
    sendSuccess(res, { data: rows });
  },

  // Live positions of all active checkouts
  async livePositions(req, res) {
    const rows = await locationService.getLivePositions();
    sendSuccess(res, rows);
  },

  // GPS track history for a single equipment (trail line)
  async equipmentTrack(req, res) {
    const hours = parseInt(req.query.hours) || 24;
    const rows  = await locationService.getEquipmentTrack(req.params.equipmentId, hours);
    sendSuccess(res, rows);
  },
};
