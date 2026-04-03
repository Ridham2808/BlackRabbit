// ============================================================
// ERROR HANDLER — Global Express error middleware
// Must be registered LAST in app.js
// Catches all errors thrown from controllers/services
// ============================================================

const logger = require('../config/logger');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log error details
  logger.error('Unhandled error', {
    error:      err.message,
    stack:      err.stack,
    path:       req.originalUrl,
    method:     req.method,
    requestId:  req.requestId,
    userId:     req.user?.id,
  });

  // Postgresql unique constraint violation
  if (err.code === '23505') {
    const match = err.detail?.match(/Key \((.+)\)=\((.+)\)/);
    return res.status(409).json({
      success: false,
      message: match
        ? `${match[1]} '${match[2]}' already exists`
        : 'Duplicate entry',
    });
  }

  // Postgresql foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  // Joi validation errors (if not caught by validateRequest middleware)
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors:  err.details?.map((d) => ({ field: d.context?.key, message: d.message })),
    });
  }

  // JWT errors
  if (err.name === 'JWTExpired') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB`,
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Unexpected file field' });
  }

  // Known HTTP errors (thrown manually)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default 500
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isDev && { detail: err.message, stack: err.stack }),
  });
}

module.exports = errorHandler;
