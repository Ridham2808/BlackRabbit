// ============================================================
// REQUEST ID MIDDLEWARE
// Attaches unique UUID to every request for distributed tracing
// ============================================================

const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = requestId;
