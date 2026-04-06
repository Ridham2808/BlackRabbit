// ============================================================
// RATE LIMITERS — different limits per route group
// ============================================================

const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// Handler for when limit is hit
const onLimitReached = (req, res, options) => {
  logger.warn('Rate limit hit', {
    ip:     req.ip,
    path:   req.path,
    method: req.method,
  });
};

// ── Global API limiter (all routes) ────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  handler: (req, res, next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json(options.message);
  },
});

// ── Auth / Login limiter — very strict ─────────────────────
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max:      parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
  skipSuccessfulRequests: true,   // only count failed attempts
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: 'Too many login attempts. Account locked for 15 minutes.' },
  handler: (req, res, next, options) => {
    onLimitReached(req, res, options);
    res.status(429).json(options.message);
  },
});

// ── File upload limiter ─────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max:      50,
  message: { success: false, message: 'Upload limit reached. Try again in 1 hour.' },
});

// ── Report/export limiter ───────────────────────────────────
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max:      20,
  message: { success: false, message: 'Export limit reached. Try again in 1 hour.' },
});

// ── Offline sync limiter ────────────────────────────────────
const offlineSyncLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      30,
  message: { success: false, message: 'Sync rate limit exceeded. Please wait.' },
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, exportLimiter, offlineSyncLimiter };

