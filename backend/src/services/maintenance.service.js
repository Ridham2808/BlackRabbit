// ============================================================
// MAINTENANCE SERVICE
// ============================================================

const { pool }                  = require('../config/database');
const { MAINTENANCE_QUERIES }   = require('../queries/maintenance.queries');
const { EQUIPMENT_STATUS }      = require('../constants/statusTypes');
const { AUDIT_ACTIONS }         = require('../constants/alertTypes');
const auditService              = require('./audit.service');

async function listMaintenance(query = {}) {
  const { page = 1, limit = 20, status, equipment_id } = query;
  let where = ''; let params = []; let pIdx = 1;
  if (status)       { where += ` AND mr.status = $${pIdx++}`;       params.push(status); }
  if (equipment_id) { where += ` AND mr.equipment_id = $${pIdx++}`; params.push(equipment_id); }
  const offset = (page - 1) * limit;
  const sql    = `${MAINTENANCE_QUERIES.LIST} ${where} ORDER BY mr.scheduled_date DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getMaintenanceById(id) {
  const { rows } = await pool.query(MAINTENANCE_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Maintenance record not found'), { statusCode: 404 });
  return rows[0];
}

async function scheduleMaintenance(data, user) {
  const { equipment_id, type, scheduled_date, assigned_technician_id, notes } = data;

  // Get equipment info for serial
  const { rows: eRows } = await pool.query('SELECT serial_number, name, home_base_id FROM equipment WHERE id = $1', [equipment_id]);
  if (!eRows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });

  // Get technician name if assigned
  let techName = null;
  if (assigned_technician_id) {
    const { rows: tRows } = await pool.query('SELECT full_name FROM personnel WHERE id = $1', [assigned_technician_id]);
    techName = tRows[0]?.full_name || null;
  }

  const { rows } = await pool.query(MAINTENANCE_QUERIES.CREATE, [
    equipment_id, eRows[0].serial_number, type, scheduled_date,
    assigned_technician_id || null, techName, notes || null,
  ]);

  auditService.createLog({ action: AUDIT_ACTIONS.MAINTENANCE_SCHEDULED, performedBy: user, targetEntityType: 'MAINTENANCE', targetEntityId: rows[0].id, targetEntityName: eRows[0].name });

  return rows[0];
}

async function startMaintenance(id, user) {
  const { rows } = await pool.query(MAINTENANCE_QUERIES.START, [id]);
  if (!rows[0]) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  // Mark equipment as under maintenance
  await pool.query('UPDATE equipment SET status = $2 WHERE id = $1', [rows[0].equipment_id, EQUIPMENT_STATUS.UNDER_MAINTENANCE]);

  auditService.createLog({ action: AUDIT_ACTIONS.MAINTENANCE_STARTED, performedBy: user, targetEntityType: 'MAINTENANCE', targetEntityId: id });
  return rows[0];
}

async function completeMaintenance(id, data, user) {
  const { work_performed, parts_replaced, total_cost, condition_before, condition_after,
          technician_signature_data, is_fit_for_duty, next_maintenance_recommended } = data;

  const { rows } = await pool.query(MAINTENANCE_QUERIES.COMPLETE, [
    id, work_performed, JSON.stringify(parts_replaced || {}), total_cost,
    condition_before, condition_after, technician_signature_data,
    is_fit_for_duty, next_maintenance_recommended || null,
  ]);
  if (!rows[0]) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  // Restore equipment + update maintenance dates
  await pool.query(
    `UPDATE equipment SET status = $2, condition = $3, updated_at = NOW() WHERE id = $4`,
    [EQUIPMENT_STATUS.OPERATIONAL, condition_after, rows[0].equipment_id]
  );
  if (next_maintenance_recommended) {
    await pool.query(MAINTENANCE_QUERIES.UPDATE_EQUIPMENT_DATES, [rows[0].equipment_id, next_maintenance_recommended]);
  }

  auditService.createLog({ action: AUDIT_ACTIONS.MAINTENANCE_COMPLETED, performedBy: user, targetEntityType: 'MAINTENANCE', targetEntityId: id });
  return rows[0];
}

module.exports = { listMaintenance, getMaintenanceById, scheduleMaintenance, startMaintenance, completeMaintenance };
