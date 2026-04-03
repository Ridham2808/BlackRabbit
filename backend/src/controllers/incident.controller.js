// ============================================================
// INCIDENT CONTROLLER
// ============================================================
const incidentService = require('../services/incident.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const rows = await incidentService.listIncidents(req.query);
    sendSuccess(res, rows);
  },

  async getById(req, res) {
    const record = await incidentService.getIncidentById(req.params.id);
    sendSuccess(res, record);
  },

  async report(req, res) {
    const record = await incidentService.reportIncident(req.body, req.user);
    sendCreated(res, record, 'Incident reported');
  },

  async update(req, res) {
    const record = await incidentService.updateIncident(req.params.id, req.body, req.user);
    sendSuccess(res, record, 'Incident updated');
  },

  async close(req, res) {
    const record = await incidentService.closeIncident(req.params.id, req.body.resolution_notes, req.user);
    sendSuccess(res, record, 'Incident closed');
  },
};
