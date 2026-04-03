// ============================================================
// INCIDENT SERVICE
// ============================================================

const { pool }            = require('../config/database');
const { INCIDENT_QUERIES }= require('../queries/incident.queries');
const { EQUIPMENT_STATUS }= require('../constants/statusTypes');
const { ALERT_TYPES }     = require('../constants/alertTypes');
const { generateIncidentNumber } = require('../utils/incidentNumberGenerator');
const auditService        = require('./audit.service');
const alertService        = require('./alert.service');
const { AUDIT_ACTIONS }   = require('../constants/alertTypes');

async function listIncidents(query = {}) {
  const { page = 1, limit = 20, type, status, severity } = query;
  let where = ''; let params = []; let pIdx = 1;
  if (type)     { where += ` AND ir.type = $${pIdx++}`;     params.push(type); }
  if (status)   { where += ` AND ir.status = $${pIdx++}`;   params.push(status); }
  if (severity) { where += ` AND ir.severity = $${pIdx++}`; params.push(severity); }
  const offset = (page - 1) * limit;
  const sql    = `${INCIDENT_QUERIES.LIST} ${where} ORDER BY ir.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getIncidentById(id) {
  const { rows } = await pool.query(INCIDENT_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Incident not found'), { statusCode: 404 });
  return rows[0];
}

async function reportIncident(data, user) {
  const {
    equipment_id, type, severity, description,
    last_known_latitude, last_known_longitude, last_known_location_description,
    estimated_value_loss, police_report_number,
  } = data;

  const { rows: eRows } = await pool.query('SELECT serial_number, name, home_base_id FROM equipment WHERE id = $1', [equipment_id]);
  if (!eRows[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });

  const incidentNumber = generateIncidentNumber();

  const { rows } = await pool.query(INCIDENT_QUERIES.CREATE, [
    incidentNumber, equipment_id, eRows[0].serial_number,
    type, severity, description,
    user.id, user.full_name,
    last_known_latitude, last_known_longitude, last_known_location_description,
    estimated_value_loss, user.id, eRows[0].home_base_id,
  ]);

  // Mark equipment as LOST or MISSING
  const newStatus = type === 'LOST' || type === 'STOLEN' || type === 'DESTROYED'
    ? EQUIPMENT_STATUS.LOST : EQUIPMENT_STATUS.FLAGGED;
  await pool.query('UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1', [equipment_id, newStatus]);

  // Trigger alert
  alertService.createAlert({
    type:        ALERT_TYPES.EQUIPMENT_LOST,
    severity:    'CRITICAL',
    title:       `${type}: ${eRows[0].name}`,
    message:     description,
    equipmentId: equipment_id,
    baseId:      eRows[0].home_base_id,
    metadata:    { incidentNumber, reportedBy: user.full_name },
  });

  auditService.createLog({ action: AUDIT_ACTIONS.INCIDENT_REPORTED, performedBy: user, targetEntityType: 'INCIDENT', targetEntityId: rows[0].id, targetEntityName: incidentNumber });

  return rows[0];
}

async function updateIncident(id, data, user) {
  const { status, investigation_notes } = data;
  const { rows } = await pool.query(INCIDENT_QUERIES.UPDATE_STATUS, [id, status, investigation_notes]);
  if (!rows[0]) throw Object.assign(new Error('Incident not found'), { statusCode: 404 });
  auditService.createLog({ action: AUDIT_ACTIONS.INCIDENT_UPDATED, performedBy: user, targetEntityType: 'INCIDENT', targetEntityId: id });
  return rows[0];
}

async function closeIncident(id, resolution_notes, user) {
  const { rows } = await pool.query(INCIDENT_QUERIES.CLOSE, [id, resolution_notes]);
  if (!rows[0]) throw Object.assign(new Error('Incident not found'), { statusCode: 404 });
  auditService.createLog({ action: AUDIT_ACTIONS.INCIDENT_CLOSED, performedBy: user, targetEntityType: 'INCIDENT', targetEntityId: id });
  return rows[0];
}

module.exports = { listIncidents, getIncidentById, reportIncident, updateIncident, closeIncident };
