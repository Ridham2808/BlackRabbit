// ============================================================
// EQUIPMENT CONTROLLER
// ============================================================
const { pool } = require('../config/database');
const equipmentService = require('../services/equipment.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const result = await equipmentService.listEquipment(req.user, req.query);
    sendSuccess(res, result);
  },

  async listCategories(req, res) {
    const { rows } = await pool.query('SELECT * FROM equipment_categories ORDER BY display_name ASC');
    sendSuccess(res, rows);
  },

  async getById(req, res) {
    const item = await equipmentService.getEquipmentById(req.params.id);
    sendSuccess(res, item);
  },

  async getBySerial(req, res) {
    const item = await equipmentService.getBySerial(req.params.serial);
    sendSuccess(res, item);
  },

  async create(req, res) {
    const item = await equipmentService.createEquipment(req.body, req.user);
    sendCreated(res, item, 'Equipment created');
  },

  async update(req, res) {
    const item = await equipmentService.updateEquipment(req.params.id, req.body);
    sendSuccess(res, item, 'Equipment updated');
  },

  async generateQR(req, res) {
    const result = await equipmentService.generateQR(req.params.id);
    sendSuccess(res, result, 'QR code generated');
  },

  async remove(req, res) {
    await equipmentService.deleteEquipment(req.params.id);
    sendSuccess(res, null, 'Equipment deleted');
  },

  async dashboardStats(req, res) {
    const stats = await equipmentService.getDashboardStats(req.user.base_id);
    sendSuccess(res, stats);
  },

  async getCustodyChain(req, res) {
    const { id: eqId } = req.params;
    const { role, id: userId } = req.user;
    
    let roleFilter = '';
    const params = [eqId];
    
    if (role === 'SOLDIER') {
      roleFilter = `AND (cc.to_custodian_id = $2 OR cc.from_custodian_id = $2 OR cc.performed_by_id = $2)`;
      params.push(userId);
    }

    const { rows } = await pool.query(
      `SELECT cc.*, e.name AS equipment_name FROM custody_chain cc
       LEFT JOIN equipment e ON e.id = cc.equipment_id
       WHERE cc.equipment_id = $1 ${roleFilter} ORDER BY cc.timestamp DESC`,
      params
    );
    sendSuccess(res, rows);
  },
};
