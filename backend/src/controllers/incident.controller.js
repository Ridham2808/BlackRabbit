// ============================================================
// ADVANCED INCIDENT CONTROLLER
// ============================================================
const incidentService = require('../services/incident.service');
const { sendSuccess, sendCreated, sendError } = require('../utils/responseFormatter');

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
    // Expects: { equipment_ids: [], type, severity, description, last_known_latitude... }
    const record = await incidentService.reportIncident(req.body, req.user);
    sendCreated(res, record, 'Incident reported successfully');
  },

  async captureWitnessStatement(req, res) {
    const { id } = req.params;
    const record = await incidentService.captureWitnessStatement(id, req.body, req.user);
    sendCreated(res, record, 'Witness statement captured');
  },

  async acknowledgeStolenReport(req, res) {
    const { id } = req.params;
    const record = await incidentService.acknowledgeStolenReport(id, req.body, req.user);
    sendSuccess(res, record, 'Stolen report acknowledged by CO');
  },

  async addInvestigationEntry(req, res) {
    const { id } = req.params;
    const { entry } = req.body;
    const record = await incidentService.addInvestigationEntry(id, entry, req.user);
    sendSuccess(res, record, 'Investigation entry added');
  },

  async uploadEvidence(req, res) {
    if (!req.file) return sendError(res, 'No file uploaded', 400);
    const { id } = req.params;
    const record = await incidentService.uploadEvidence(id, req.file, req.user);
    sendSuccess(res, record, 'Evidence file uploaded and hashed');
  },

  async resolve(req, res) {
    const { id } = req.params;
    const record = await incidentService.resolveIncident(id, req.body, req.user);
    sendSuccess(res, record, 'Incident resolved and accountability scores updated');
  },
};
