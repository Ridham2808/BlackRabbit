// ============================================================
// CHECKOUT CONTROLLER
// ============================================================
const checkoutService = require('../services/checkout.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const rows = await checkoutService.listCheckouts(req.user, req.query);
    sendSuccess(res, rows);
  },

  async getById(req, res) {
    const record = await checkoutService.getCheckoutById(req.params.id);
    sendSuccess(res, record);
  },

  async checkout(req, res) {
    const record = await checkoutService.checkout(req.body, req.user);
    sendCreated(res, record, 'Equipment checked out successfully');
  },

  async checkIn(req, res) {
    const record = await checkoutService.checkIn(req.params.id, req.body, req.user);
    sendSuccess(res, record, 'Equipment checked in successfully');
  },

  async myCheckouts(req, res) {
    const rows = await checkoutService.listCheckouts(req.user, { ...req.query, my_checkouts: true });
    sendSuccess(res, rows);
  },
};
