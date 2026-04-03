// ============================================================
// SERVER.JS — Application entry point
// Creates HTTP server, attaches Socket.io, starts cron jobs
// ============================================================

require('dotenv').config();

const http    = require('http');
const app     = require('./app');
const logger  = require('./src/config/logger');
const { initSocket } = require('./src/config/socket');
const { redis, ping } = require('./src/config/redis');
const { testConnection } = require('./src/config/database');

const PORT = parseInt(process.env.BACKEND_PORT, 10) || 5000;
const HOST = process.env.BACKEND_HOST || '0.0.0.0';

async function startServer() {
  // ── Verify connections ──────────────────────────────────────
  logger.info('Starting DEAS Backend…');

  try {
    const dbInfo = await testConnection();
    logger.info('PostgreSQL connected', { db: dbInfo.db, time: dbInfo.time });
  } catch (err) {
    logger.error('PostgreSQL connection failed', { error: err.message });
    process.exit(1);
  }

  try {
    await redis.connect();
    const pong = await ping();
    logger.info('Redis connected', { response: pong });
  } catch (err) {
    logger.error('Redis connection failed', { error: err.message });
    process.exit(1);
  }

  // ── Create HTTP server ───────────────────────────────────────
  const httpServer = http.createServer(app);

  // ── Attach Socket.io ─────────────────────────────────────────
  initSocket(httpServer);

  // ── Start cron jobs ──────────────────────────────────────────
  try {
    const { startAllJobs } = require('./src/jobs/jobScheduler');
    startAllJobs();
    logger.info('Cron jobs started');
  } catch (err) {
    logger.warn('Failed to start cron jobs', { error: err.message });
  }

  // ── Listen ───────────────────────────────────────────────────
  httpServer.listen(PORT, HOST, () => {
    logger.info(`DEAS Backend running`, {
      url:  `http://${HOST}:${PORT}`,
      env:  process.env.NODE_ENV || 'development',
      pid:  process.pid,
    });
  });

  // ── Graceful shutdown ────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(async () => {
      try {
        await redis.quit();
        logger.info('Redis connection closed');
      } catch (e) { /* ignore */ }
      logger.info('Server shut down');
      process.exit(0);
    });

    // Force exit after 15 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});
