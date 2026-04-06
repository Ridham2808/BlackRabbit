// ============================================================
// DATABASE CONFIG — PostgreSQL pool (Neon.tech via pg)
// All queries use parameterized statements — no string concat
// ============================================================

const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max:               parseInt(process.env.DB_POOL_MAX, 10)              || 20,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 10) || 30000,
  // Neon.tech serverless can take up to ~15s on cold start — raise the timeout
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10) || 15000,
});

pool.on('connect', () => {
  logger.debug('PostgreSQL pool: new client connected');
});

pool.on('error', (err) => {
  // Log but do NOT exit — transient Neon idle-client errors should not crash the server
  logger.error('PostgreSQL pool: unexpected error on idle client', { error: err.message });
});

/**
 * Execute a single parameterized query
 * @param {string} text   — SQL string with $1, $2… placeholders
 * @param {any[]}  params — Array of values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { duration_ms: duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('Query error', { error: err.message, query: text });
    throw err;
  }
}

/**
 * Get a dedicated client for transactions
 * Always call client.release() in a finally block
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);

  // Wrap to add logging
  client.query = async (text, params = []) => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      logger.debug('Transaction query', { duration_ms: Date.now() - start });
      return result;
    } catch (err) {
      logger.error('Transaction query error', { error: err.message });
      throw err;
    }
  };

  return client;
}

/**
 * Run a function inside a transaction — auto commit/rollback
 * @param {Function} fn — async (client) => {}
 */
async function withTransaction(fn) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Test the connection — used in /health and startup
 */
async function testConnection(retries = 3, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await query('SELECT NOW() as time, current_database() as db');
      return result.rows[0];
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn(`PostgreSQL connect attempt ${attempt}/${retries} failed — retrying in ${delayMs}ms`, { error: err.message });
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

module.exports = { query, getClient, withTransaction, testConnection, pool };
