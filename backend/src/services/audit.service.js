// ============================================================
// AUDIT SERVICE — Insert-only audit log
// ============================================================

const { pool }         = require('../config/database');
const { AUDIT_QUERIES }= require('../queries/audit.queries');
const { AUDIT_SEVERITY, DEVICE_TYPE } = require('../constants/statusTypes');
const logger           = require('../config/logger');

/**
 * Create a single audit log entry.
 * Fire-and-forget safe — errors are logged but do not throw.
 */
async function createLog({
  action,
  performedBy,          // { id, full_name, role, service_number }
  targetEntityType,
  targetEntityId,
  targetEntityName,
  changesBefore = null,
  changesAfter  = null,
  ip            = null,
  deviceType    = DEVICE_TYPE.WEB,
  severity      = AUDIT_SEVERITY.INFO,
  sessionId     = null,
  requestId     = null,
  isAnomaly     = false,
  anomalyScore  = null,
  additionalContext = null,
}, client = null) {
  const db = client || pool;
  try {
    const { rows } = await db.query(AUDIT_QUERIES.INSERT, [
      action,
      performedBy?.id   || null,
      performedBy?.full_name || 'SYSTEM',
      performedBy?.role || 'SYSTEM',
      performedBy?.service_number || null,
      targetEntityType  || null,
      targetEntityId    || null,
      targetEntityName  || null,
      changesBefore ? JSON.stringify(changesBefore) : null,
      changesAfter  ? JSON.stringify(changesAfter)  : null,
      ip,
      deviceType,
      severity,
      sessionId,
      requestId,
      isAnomaly,
      anomalyScore,
      additionalContext ? JSON.stringify(additionalContext) : null,
    ]);
    return rows[0];
  } catch (err) {
    logger.error('Audit log insert failed', { action, error: err.message });
    return null;
  }
}

/**
 * System-level log (no performing user)
 */
async function systemLog({ action, targetEntityType, targetEntityId, targetEntityName, severity = AUDIT_SEVERITY.INFO, additionalContext }) {
  return createLog({ action, performedBy: null, targetEntityType, targetEntityId, targetEntityName, severity, deviceType: DEVICE_TYPE.SYSTEM, additionalContext });
}

/**
 * List audit logs with filters
 */
async function listLogs({ page = 1, limit = 50, action, severity, performedById, targetEntityId, isAnomaly, startDate, endDate } = {}) {
  let where   = '';
  let params  = [];
  let pIdx    = 1;

  if (action)         { where += ` AND al.action = $${pIdx++}`;                    params.push(action); }
  if (severity)       { where += ` AND al.severity = $${pIdx++}`;                  params.push(severity); }
  if (performedById)  { where += ` AND al.performed_by_id = $${pIdx++}`;           params.push(performedById); }
  if (targetEntityId) { where += ` AND al.target_entity_id = $${pIdx++}`;          params.push(targetEntityId); }
  if (isAnomaly !== undefined) { where += ` AND al.is_anomaly = $${pIdx++}`; params.push(isAnomaly); }
  if (startDate)      { where += ` AND al.created_at >= $${pIdx++}`;               params.push(startDate); }
  if (endDate)        { where += ` AND al.created_at <= $${pIdx++}`;               params.push(endDate); }

  const offset = (page - 1) * limit;
  const sql    = `${AUDIT_QUERIES.LIST} ${where} ORDER BY al.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
  params.push(limit, offset);

  const countSql = `SELECT COUNT(*) FROM audit_logs al WHERE 1=1 ${where}`;
  const [{ rows }, { rows: cnt }] = await Promise.all([
    pool.query(sql, params),
    pool.query(countSql, params.slice(0, params.length - 2)),
  ]);

  return {
    data:       rows,
    pagination: { page, limit, total: parseInt(cnt[0].count), pages: Math.ceil(cnt[0].count / limit) },
  };
}

module.exports = { createLog, systemLog, listLogs };
