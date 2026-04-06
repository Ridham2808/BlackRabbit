
const checkoutRequestService = require('../services/checkoutRequest.service');
const { sendSuccess, sendCreated } = require('../utils/responseFormatter');
const { catchAsync } = require('../utils/catchAsync');

const createRequest = catchAsync(async (req, res) => {
  const request = await checkoutRequestService.createRequest(req.body, req.user);
  sendCreated(res, request, 'Equipment request submitted successfully');
});

const listPending = catchAsync(async (req, res) => {
  const requests = await checkoutRequestService.listPendingRequests(req.user);
  sendSuccess(res, requests, 'Pending requests retrieved');
});

const listMyRequests = catchAsync(async (req, res) => {
  const requests = await checkoutRequestService.listMyRequests(req.user);
  sendSuccess(res, requests, 'My requests retrieved');
});

const approve = catchAsync(async (req, res) => {
  const request = await checkoutRequestService.approveRequest(req.params.id, req.user);
  sendSuccess(res, request, 'Request approved');
});

const reject = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const request = await checkoutRequestService.rejectRequest(req.params.id, req.user, reason);
  sendSuccess(res, request, 'Request rejected');
});

module.exports = {
  createRequest,
  listPending,
  listMyRequests,
  approve,
  reject
};
