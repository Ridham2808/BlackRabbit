// ============================================================
// REDIS CONFIG — ioredis client with retry + health check
// Used for: sessions, rate limiting, cache, pub/sub, location
// ============================================================

const Redis = require('ioredis');
const logger = require('./logger');

const redisConfig = {
  host:           process.env.REDIS_HOST     || 'localhost',
  port:           parseInt(process.env.REDIS_PORT, 10) || 6380,
  password:       process.env.REDIS_PASSWORD || undefined,
  db:             parseInt(process.env.REDIS_DB, 10)   || 0,
  lazyConnect:    true,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error('Redis: max reconnection attempts reached');
      return null; // stop retrying
    }
    const delay = Math.min(times * 200, 3000);
    logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError: (err) => {
    logger.error('Redis: connection error', { error: err.message });
    return true;
  },
};

const redis = new Redis(redisConfig);

redis.on('connect',    () => logger.info('Redis: connected'));
redis.on('ready',      () => logger.info('Redis: ready to accept commands'));
redis.on('error',  (err) => logger.error('Redis error', { error: err.message }));
redis.on('close',      () => logger.warn('Redis: connection closed'));
redis.on('reconnecting', () => logger.warn('Redis: reconnecting…'));

// TTL constants (seconds) from env
const TTL = {
  CACHE:       parseInt(process.env.REDIS_CACHE_TTL,      10) || 120,
  SESSION:     parseInt(process.env.REDIS_SESSION_TTL,    10) || 604800,
  RATE_LIMIT:  parseInt(process.env.REDIS_RATE_LIMIT_TTL, 10) || 900,
  LOCATION:    parseInt(process.env.REDIS_LOCATION_TTL,   10) || 7200,
};

// ── Key builders — keep naming consistent ───────────────────
const KEYS = {
  session:       (userId)                => `session:${userId}`,
  refreshToken:  (userId)                => `refresh_token:${userId}`,
  rateLimitLogin:(ip)                    => `rl:login:${ip}`,
  cache:         (namespace, id)         => `cache:${namespace}:${id}`,
  cacheList:     (namespace, query = '') => `cache:${namespace}:list:${query}`,
  lastLocation:  (personnelId)           => `loc:person:${personnelId}`,
  equipmentLoc:  (equipmentId)           => `loc:equipment:${equipmentId}`,
  dashboard:     (baseId)                => `dashboard:${baseId}`,
  socketUser:    (userId)                => `socket:user:${userId}`,
};

// ── Helper methods ──────────────────────────────────────────

/**
 * Set value with TTL
 */
async function setEx(key, ttl, value) {
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return redis.setex(key, ttl, serialized);
}

/**
 * Get and auto-parse JSON
 */
async function get(key) {
  const value = await redis.get(key);
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

/**
 * Delete one or more keys
 */
async function del(...keys) {
  return redis.del(...keys);
}

/**
 * Test connectivity
 */
async function ping() {
  return redis.ping();
}

/**
 * Increment with expiry (for rate limiting)
 */
async function incrEx(key, ttl) {
  const val = await redis.incr(key);
  if (val === 1) await redis.expire(key, ttl);
  return val;
}

module.exports = { redis, TTL, KEYS, setEx, get, del, ping, incrEx };
