// ============================================================
// APP.JS — Express application factory
// Registers all middleware and routes
// ============================================================

require('dotenv').config();
require('express-async-errors');

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const cookieParser   = require('cookie-parser');
const morgan         = require('morgan');

const corsOptions    = require('./src/config/corsOptions');
const logger         = require('./src/config/logger');
const { globalLimiter } = require('./src/config/rateLimiter');

// Middleware
const requestId      = require('./src/middleware/requestId');
const scopeFilter    = require('./src/middleware/scopeFilter');
const offlineSyncHeader = require('./src/middleware/offlineSyncHeader');
const errorHandler   = require('./src/middleware/errorHandler');

// Routes (stubs — will be filled per domain)
const authRoutes       = require('./src/routes/auth.routes');
const equipmentRoutes  = require('./src/routes/equipment.routes');
const checkoutRoutes   = require('./src/routes/checkout.routes');
const personnelRoutes  = require('./src/routes/personnel.routes');
const maintenanceRoutes= require('./src/routes/maintenance.routes');
const transferRoutes   = require('./src/routes/transfer.routes');
const incidentRoutes   = require('./src/routes/incident.routes');
const alertRoutes      = require('./src/routes/alert.routes');
const auditRoutes      = require('./src/routes/audit.routes');
const locationRoutes   = require('./src/routes/location.routes');
const reportRoutes     = require('./src/routes/report.routes');
const adminRoutes      = require('./src/routes/admin.routes');
const searchRoutes     = require('./src/routes/search.routes');
const syncRoutes       = require('./src/routes/sync.routes');

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allow map tiles
}));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Compression ──────────────────────────────────────────────
app.use(compression());

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request ID tracing ───────────────────────────────────────
app.use(requestId);

// ── HTTP access logging ──────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip:   (req) => req.url === '/api/health',  // don't log health checks
}));

// ── Offline sync detection ───────────────────────────────────
app.use(offlineSyncHeader);

// ── Global rate limiter ──────────────────────────────────────
app.use('/api', globalLimiter);

// ── Scope filter (runs after authenticate on each route) ─────
app.use(scopeFilter);

// ── Static files (uploaded images etc.) ─────────────────────
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const { testConnection } = require('./src/config/database');
  const { ping }           = require('./src/config/redis');
  const dbOk    = await testConnection().catch(() => null);
  const redisOk = await ping().catch(() => null);

  const healthy = !!dbOk && redisOk === 'PONG';
  res.status(healthy ? 200 : 503).json({
    status:    healthy ? 'healthy' : 'degraded',
    version:   process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk  ? { status: 'up', db: dbOk.db, time: dbOk.time } : { status: 'down' },
      redis:    redisOk === 'PONG' ? { status: 'up' } : { status: 'down' },
    },
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/equipment',   equipmentRoutes);
app.use('/api/checkouts',   checkoutRoutes);
app.use('/api/personnel',   personnelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/transfers',   transferRoutes);
app.use('/api/incidents',   incidentRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/audit',       auditRoutes);
app.use('/api/location',    locationRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/search',      searchRoutes);
app.use('/api/sync',        syncRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

module.exports = app;
