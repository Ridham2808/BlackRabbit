// ============================================================
// TRANSFER CONTROLLER
// ============================================================
const transferService = require('../services/transfer.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');

module.exports = {
  async list(req, res) {
    const rows = await transferService.listTransfers(req.query);
    sendSuccess(res, rows);
  },

  async getById(req, res) {
    const record = await transferService.getTransferById(req.params.id);
    sendSuccess(res, record);
  },

  async create(req, res) {
    const record = await transferService.createTransfer(req.body, req.user);
    sendCreated(res, record, 'Transfer requested');
  },

  async approveSender(req, res) {
    const record = await transferService.approveSender(req.params.id, req.user);
    sendSuccess(res, record, 'Transfer approved by sender');
  },

  async approveReceiver(req, res) {
    const record = await transferService.approveReceiver(req.params.id, req.user);
    sendSuccess(res, record, 'Transfer approved by receiver');
  },

  async dispatch(req, res) {
    const record = await transferService.dispatchTransfer(req.params.id, req.body, req.user);
    sendSuccess(res, record, 'Transfer dispatched');
  },

  async receive(req, res) {
    const record = await transferService.receiveTransfer(req.params.id, req.body, req.user);
    sendSuccess(res, record, 'Transfer received');
  },
};
