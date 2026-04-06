// ============================================================
// TRANSFER SERVICE
// ============================================================

const { pool }             = require('../config/database');
const { TRANSFER_QUERIES } = require('../queries/transfer.queries');
const { EQUIPMENT_STATUS } = require('../constants/statusTypes');
const { AUDIT_ACTIONS }    = require('../constants/alertTypes');
const auditService         = require('./audit.service');
const { emitTransferStatusChanged } = require('../events/emitters');

async function listTransfers(query = {}) {
  const { page = 1, limit = 20, status } = query;
  let where = ''; let params = []; let pIdx = 1;
  if (status) { where += ` AND tr.status = $${pIdx++}`; params.push(status); }
  const offset = (page - 1) * limit;
  const sql    = `${TRANSFER_QUERIES.LIST} ${where} ORDER BY tr.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getTransferById(id) {
  const { rows } = await pool.query(TRANSFER_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
  return rows[0];
}

async function createTransfer(data, user) {
  const { equipment_id, type, priority, receiving_officer_id, to_unit_id, to_base_id, reason, notes } = data;

  const { rows: eRows } = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
  if (!eRows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });

  const { rows } = await pool.query(TRANSFER_QUERIES.CREATE, [
    equipment_id, type, priority, user.id, receiving_officer_id,
    eRows[0].home_unit_id, eRows[0].home_base_id, to_unit_id, to_base_id, reason, notes,
  ]);

  // Flag equipment as PENDING_TRANSFER or similar
  await pool.query('UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1', [equipment_id, EQUIPMENT_STATUS.FLAGGED]);

  auditService.createLog({ action: AUDIT_ACTIONS.TRANSFER_REQUESTED, performedBy: user, targetEntityType: 'TRANSFER', targetEntityId: rows[0].id });
  emitTransferStatusChanged(user.base_id, rows[0]);
  return rows[0];
}

async function approveSender(id, user) {
  const { rows } = await pool.query(TRANSFER_QUERIES.APPROVE_SENDER, [id, user.id]);
  if (!rows[0]) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
  auditService.createLog({ action: AUDIT_ACTIONS.TRANSFER_APPROVED, performedBy: user, targetEntityType: 'TRANSFER', targetEntityId: id });
  return rows[0];
}

async function approveReceiver(id, user) {
  const { rows } = await pool.query(TRANSFER_QUERIES.APPROVE_RECEIVER, [id, user.id]);
  if (!rows[0]) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
  return rows[0];
}

async function dispatchTransfer(id, data, user) {
  const { dispatch_latitude, dispatch_longitude } = data;
  const { rows } = await pool.query(TRANSFER_QUERIES.DISPATCH, [id, dispatch_latitude, dispatch_longitude]);
  if (!rows[0]) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });

  // Now set equipment to IN_TRANSIT
  await pool.query('UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1', [rows[0].equipment_id, EQUIPMENT_STATUS.IN_TRANSIT]);
  auditService.createLog({ action: AUDIT_ACTIONS.TRANSFER_DISPATCHED, performedBy: user, targetEntityType: 'TRANSFER', targetEntityId: id });
  return rows[0];
}

async function receiveTransfer(id, data, user) {
  const { receipt_latitude, receipt_longitude } = data;
  const transfer = await getTransferById(id);
  const { rows } = await pool.query(TRANSFER_QUERIES.RECEIVE, [id, receipt_latitude, receipt_longitude]);

  // Reassign equipment to new unit/base
  await pool.query(
    `UPDATE equipment SET home_unit_id = $2, home_base_id = $3, status = 'OPERATIONAL', updated_at = NOW() WHERE id = $4`,
    [transfer.to_unit_id, transfer.to_base_id, transfer.equipment_id]
  );

  auditService.createLog({ action: AUDIT_ACTIONS.TRANSFER_RECEIVED, performedBy: user, targetEntityType: 'TRANSFER', targetEntityId: id });
  return rows[0];
}

module.exports = { listTransfers, getTransferById, createTransfer, approveSender, approveReceiver, dispatchTransfer, receiveTransfer };
