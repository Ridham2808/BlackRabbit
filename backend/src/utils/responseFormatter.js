// ============================================================
// RESPONSE FORMATTER — Consistent API response shape
// ============================================================

function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({ success: true, message, data: data ?? null });
}

function sendCreated(res, data, message = 'Created') {
  sendSuccess(res, data, message, 201);
}

function sendError(res, message, statusCode = 400, errors = null) {
  res.status(statusCode).json({ success: false, message, errors: errors ?? undefined });
}

module.exports = { sendSuccess, sendCreated, sendError };
