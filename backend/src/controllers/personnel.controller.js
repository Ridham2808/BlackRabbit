// ============================================================
// PERSONNEL CONTROLLER
// ============================================================
const personnelService = require('../services/personnel.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const rows = await personnelService.listPersonnel(req.user, req.query);
    sendSuccess(res, rows);
  },

  async getById(req, res) {
    const person = await personnelService.getPersonnelById(req.params.id);
    sendSuccess(res, person);
  },

  async create(req, res) {
    const person = await personnelService.createPersonnel(req.body, req.user);
    sendCreated(res, person, 'Personnel created');
  },

  async update(req, res) {
    const person = await personnelService.updatePersonnel(req.params.id, req.body);
    sendSuccess(res, person, 'Personnel updated');
  },

  async toggleActive(req, res) {
    const { is_active } = req.body;
    const person = await personnelService.toggleActive(req.params.id, is_active);
    sendSuccess(res, person, `Account ${is_active ? 'activated' : 'deactivated'}`);
  },

  async listBases(req, res) {
    const rows = await personnelService.listBases();
    sendSuccess(res, rows);
  },

  async listUnits(req, res) {
    const rows = await personnelService.listUnits(req.query.base_id);
    sendSuccess(res, rows);
  },
};
