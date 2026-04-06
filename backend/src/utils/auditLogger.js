// ============================================================
// AUDIT LOGGER UTILITY
// Write an entry to audit_logs from anywhere in the codebase
// ============================================================

const { query } = require('../config/database');
const logger = require('../config/logger');
const { DEVICE_TYPE } = require('../constants/statusTypes');

/**
 * Write an audit log entry
 * @param {object} params
 */
async function writeAuditLog({
  action,
  performedBy,         // req.user object
  targetEntityType,
  targetEntityId,
  targetEntityName,
  changesBefore = null,
  changesAfter  = null,
  req           = null, // Express request (for IP, user-agent)
  severity      = 'INFO',
  additionalContext = null,
}) {
  try {
    const ip        = req?.ip || null;
    const userAgent = req?.headers?.['user-agent'] || null;
    const deviceType = req?.headers?.['x-device-type'] === 'mobile'
      ? DEVICE_TYPE.MOBILE
      : DEVICE_TYPE.WEB;
    const sessionId  = req?.user?.sessionId || null;
    const requestId  = req?.requestId || null;

    await query(
      `INSERT INTO audit_logs
        (action, performed_by_id, performed_by_name, performed_by_role,
         performed_by_service_number, target_entity_type, target_entity_id,
         target_entity_name, changes_before, changes_after, ip_address,
         user_agent, device_type, severity, session_id, request_id, additional_context)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        action,
        performedBy?.id              || null,
        performedBy?.fullName        || null,
        performedBy?.role            || null,
        performedBy?.serviceNumber   || null,
        targetEntityType             || null,
        targetEntityId               || null,
        targetEntityName             || null,
        changesBefore  ? JSON.stringify(changesBefore) : null,
        changesAfter   ? JSON.stringify(changesAfter)  : null,
        ip,
        userAgent,
        deviceType,
        severity,
        sessionId,
        requestId,
        additionalContext ? JSON.stringify(additionalContext) : null,
      ]
    );
  } catch (err) {
    // Never throw from audit logger — log error but don't fail the request
    logger.error('Failed to write audit log', { error: err.message, action });
  }
}

module.exports = { writeAuditLog };
