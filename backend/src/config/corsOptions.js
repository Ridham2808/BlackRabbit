// ============================================================
// CORS OPTIONS
// ============================================================

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials:         true,   // allow cookies (refresh token)
  methods:             ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:      ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Offline-Sync'],
  exposedHeaders:      ['X-Request-ID', 'X-Total-Count'],
  optionsSuccessStatus: 204,
  maxAge:              86400,   // preflight cache 24 hrs
};

module.exports = corsOptions;
