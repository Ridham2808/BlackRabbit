// ============================================================
// AUDIT QUERIES
// ============================================================

const AUDIT_QUERIES = {
  INSERT: `
    INSERT INTO audit_logs (
      action, performed_by_id, performed_by_name, performed_by_role,
      performed_by_service_number, target_entity_type, target_entity_id,
      target_entity_name, changes_before, changes_after,
      ip_address, device_type, severity, session_id, request_id,
      is_anomaly, anomaly_score, additional_context
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18
    ) RETURNING id, action, performed_by_name, created_at
  `,

  LIST: `
    SELECT
      al.id, al.action, al.performed_by_name, al.performed_by_role,
      al.performed_by_service_number, al.target_entity_type,
      al.target_entity_name, al.ip_address, al.device_type,
      al.severity, al.is_anomaly, al.anomaly_score, al.created_at,
      al.changes_before, al.changes_after, al.additional_context
    FROM audit_logs al
    WHERE 1=1
  `,

  GET_BY_ID: `
    SELECT * FROM audit_logs WHERE id = $1 LIMIT 1
  `,

  GET_ENTITY_HISTORY: `
    SELECT al.id, al.action, al.performed_by_name, al.performed_by_role,
           al.severity, al.changes_before, al.changes_after,
           al.ip_address, al.device_type, al.created_at
    FROM audit_logs al
    WHERE al.target_entity_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2 OFFSET $3
  `,

  ANOMALY_LIST: `
    SELECT * FROM audit_logs
    WHERE is_anomaly = true
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `,

  STATS_BY_ACTION: `
    SELECT action, COUNT(*) AS count
    FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY action
    ORDER BY count DESC
    LIMIT 20
  `,
};

module.exports = { AUDIT_QUERIES };
