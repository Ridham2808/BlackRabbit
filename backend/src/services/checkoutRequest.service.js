
const { pool } = require('../config/database');
const { CHECKOUT_REQUEST_QUERIES } = require('../queries/checkoutRequest.queries');
const { emitRequestCreated, emitRequestUpdated } = require('../events/emitters');
const logger = require('../config/logger');

async function createRequest(data, user) {
  const { equipment_category_id, purpose, expected_return_at, location } = data;

  const { rows } = await pool.query(CHECKOUT_REQUEST_QUERIES.CREATE, [
    equipment_category_id,
    user.id,
    purpose,
    expected_return_at,
    location
  ]);

  const request = rows[0];
  
  // Notify sergeants of the new request
  emitRequestCreated(user.base_id, {
    requestId: request.id,
    requesterName: user.full_name,
    purpose: request.purpose,
    expectedReturn: request.expected_return_at
  });

  return request;
}

async function listPendingRequests(user) {
  const { rows } = await pool.query(CHECKOUT_REQUEST_QUERIES.LIST_PENDING_BY_BASE, [user.base_id]);
  return rows;
}

async function listMyRequests(user) {
  const { rows } = await pool.query(CHECKOUT_REQUEST_QUERIES.LIST_BY_PERSONNEL, [user.id]);
  return rows;
}

async function getRequestById(id) {
  const { rows } = await pool.query(CHECKOUT_REQUEST_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  return rows[0];
}

async function approveRequest(id, officer) {
  const { rows } = await pool.query(CHECKOUT_REQUEST_QUERIES.APPROVE, [id, officer.id]);
  if (!rows[0]) throw Object.assign(new Error('Request not found or not pending'), { statusCode: 404 });

  const request = rows[0];
  
  emitRequestUpdated(request.personnel_id, {
    requestId: id,
    status: 'APPROVED',
    message: 'Your equipment request has been approved. Please proceed to physical handover.'
  });

  return request;
}

async function rejectRequest(id, officer, reason) {
  const { rows } = await pool.query(CHECKOUT_REQUEST_QUERIES.REJECT, [id, officer.id, reason]);
  if (!rows[0]) throw Object.assign(new Error('Request not found or not pending'), { statusCode: 404 });

  const request = rows[0];

  emitRequestUpdated(request.personnel_id, {
    requestId: id,
    status: 'REJECTED',
    message: `Your equipment request was rejected: ${reason}`
  });

  return request;
}

module.exports = {
  createRequest,
  listPendingRequests,
  listMyRequests,
  getRequestById,
  approveRequest,
  rejectRequest
};
