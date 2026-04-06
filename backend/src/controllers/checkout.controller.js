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
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || id === 'undefined' || id === 'null' || !uuidRegex.test(id)) {
      return res.status(404).json({ success: false, message: 'Checkout record not found' });
    }
    const record = await checkoutService.getCheckoutById(id);
    sendSuccess(res, record);
  },

  async checkout(req, res) {
    console.log(`[Backend API] POST /checkouts Hit by User ${req.user.id}`);
    console.log(`[Backend API] Payload:`, req.body);
    const record = await checkoutService.checkout(req.body, req.user);
    console.log(`[Backend API] Checkout Record 201 Created successfully:`, record.id);
    sendCreated(res, record, 'Equipment checked out successfully');
  },

  async checkIn(req, res) {
    console.log(`[Backend API] PATCH /checkouts/${req.params.id}/checkin Hit`);
    console.log(`[Backend API] Payload:`, req.body);
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || id === 'undefined' || id === 'null' || !uuidRegex.test(id)) {
      console.warn(`[Backend API] Invalid Checkout Identifier: ${id}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Checkout Identifier. Ensure the asset was correctly checked out before returning.' 
      });
    }
    const record = await checkoutService.checkIn(id, req.body, req.user);
    console.log(`[Backend API] Check-In Success for:`, record.id);
    sendSuccess(res, record, 'Equipment checked in successfully');
  },

  async myCheckouts(req, res) {
    const rows = await checkoutService.listCheckouts(req.user, { ...req.query, my_checkouts: true });
    sendSuccess(res, rows);
  },
};
