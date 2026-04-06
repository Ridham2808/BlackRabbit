// ============================================================
// ADVANCED INCIDENT SERVICE
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const ExifParser = require('exif-parser');
const { pool, withTransaction } = require('../config/database');
const { INCIDENT_QUERIES } = require('../queries/incident.queries');
const { EQUIPMENT_STATUS } = require('../constants/statusTypes');
const { ALERT_TYPES, AUDIT_ACTIONS } = require('../constants/alertTypes');
const { 
  ACCOUNTABILITY_SCORE_DEDUCTIONS, 
  ACCOUNTABILITY_SCORE_RESTORATIONS,
  INCIDENT_STATUS,
  INCIDENT_TYPES
} = require('../constants/incident.constants');
const auditService = require('./audit.service');
const alertService = require('./alert.service');
const notificationService = require('./notification.service');
const { emitIncidentReported } = require('../events/emitters');
const { generateIncidentNumber } = require('../utils/incidentNumberGenerator');
const logger = require('../config/logger');

/**
 * Calculates Haversine distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Report an incident (Transactional)
 */
async function reportIncident(data, user) {
  return await withTransaction(async (client) => {
    let {
      equipment_ids,        // Array of UUIDs (optional)
      equipment_serials,    // Array of serial strings (optional — from web form)
      type, severity, description,
      last_known_latitude, last_known_longitude, last_known_location_description,
      witness_personnel_ids    = [],
      witness_personnel_serials = [],  // serial strings → resolve to IDs
    } = data;

    // ── Resolve equipment serials → UUIDs if needed ─────────────
    if ((!equipment_ids || equipment_ids.length === 0) && equipment_serials?.length > 0) {
      const { rows: eqRows } = await client.query(
        `SELECT id FROM equipment WHERE serial_number = ANY($1::text[])`,
        [equipment_serials]
      );
      if (eqRows.length === 0) {
        throw Object.assign(
          new Error(`No equipment found with serial(s): ${equipment_serials.join(', ')}`),
          { statusCode: 404 }
        );
      }
      equipment_ids = eqRows.map(r => r.id);
    }

    // ── Resolve witness serials → IDs if needed ──────────────────
    if (witness_personnel_serials.length > 0 && witness_personnel_ids.length === 0) {
      const { rows: wRows } = await client.query(
        `SELECT id FROM personnel WHERE service_number = ANY($1::text[])`,
        [witness_personnel_serials]
      );
      witness_personnel_ids = wRows.map(r => r.id);
    }

    const incidentNumber = await generateIncidentNumber();
    const primaryEquipId = equipment_ids[0];

    // 1. Fetch Primary Equipment info
    const { rows: eRows } = await client.query(
      'SELECT serial_number, name, home_base_id, current_checkout_id FROM equipment WHERE id = $1', 
      [primaryEquipId]
    );
    if (!eRows[0]) throw Object.assign(new Error('Primary equipment not found'), { statusCode: 404 });

    const primaryEquip = eRows[0];

    // 2. Create Incident Report
    const coReq = type === INCIDENT_TYPES.STOLEN;
    const title = `${type}: ${primaryEquip.name}`;   // auto-generated — NOT NULL
    const { rows: iRows } = await client.query(INCIDENT_QUERIES.CREATE, [
      incidentNumber, primaryEquipId, primaryEquip.serial_number,
      type, severity,
      title,                                          // $6
      description,                                    // $7  (incident_datetime = NOW() in SQL)
      user.id, user.full_name,                        // $8, $9 responsible personnel
      last_known_latitude, last_known_longitude, last_known_location_description, // $10,$11,$12
      0, user.id, primaryEquip.home_base_id, coReq   // $13,$14,$15,$16
    ]);
    const incident = iRows[0];

    // 3. Link Assets & Suspend Custody
    for (const equipId of equipment_ids) {
      const { rows: assetRows } = await client.query(
        'SELECT serial_number, name, status, current_checkout_id FROM equipment WHERE id = $1 FOR UPDATE', 
        [equipId]
      );
      const asset = assetRows[0];

      await client.query(INCIDENT_QUERIES.LINK_EQUIPMENT, [
        incident.id, equipId, asset.serial_number, asset.name, asset.status
      ]);

      // Suspend Checkout
      if (asset.current_checkout_id) {
        await client.query(
          `UPDATE checkout_records SET status = 'CUSTODY_SUSPENDED_INCIDENT_FILED', updated_at = NOW() 
           WHERE id = $1`, [asset.current_checkout_id]
        );
      }

      // Update Equipment Status
      const newStatus = (type === INCIDENT_TYPES.STOLEN || type === INCIDENT_TYPES.LOST) 
        ? EQUIPMENT_STATUS.MISSING : EQUIPMENT_STATUS.FLAGGED;
      
      await client.query('UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1', [equipId, newStatus]);

      // Add to Custody Chain
      await client.query(`
        INSERT INTO custody_chain (equipment_id, event_type, incident_id, performed_by_id, performed_by_name, notes)
        VALUES ($1, 'FLAGGED', $2, $3, $4, $5)
      `, [equipId, incident.id, user.id, user.full_name, `Incident filed: ${type}`]);
    }

    // 4. GPS Correlation Check
    if (last_known_latitude && last_known_longitude && primaryEquip.current_checkout_id) {
      const { rows: pRows } = await client.query(
        `SELECT latitude, longitude, timestamp FROM location_pings 
         WHERE checkout_id = $1 ORDER BY timestamp DESC LIMIT 10`, 
        [primaryEquip.current_checkout_id]
      );
      
      if (pRows.length > 0) {
        const lastPing = pRows[0];
        const dist = calculateDistance(last_known_latitude, last_known_longitude, lastPing.latitude, lastPing.longitude);
        
        const gpsSnap = {
          lastPingCoordinates: { lat: lastPing.latitude, lng: lastPing.longitude, timestamp: lastPing.timestamp },
          reportedLocation: { lat: last_known_latitude, lng: last_known_longitude },
          distanceMeters: Math.round(dist),
          discrepancyFlag: dist > 500,
          trail: pRows
        };

        await client.query(
          `UPDATE incident_reports SET investigation_trail = investigation_trail || $2::jsonb 
           WHERE id = $1`, [incident.id, JSON.stringify({ type: 'GPS_CORRELATION', data: gpsSnap })]
        );
      }
    }

    // 5. Initial Investigation Entry
    await client.query(INCIDENT_QUERIES.ADD_INVESTIGATION_ENTRY, [incident.id, JSON.stringify({
      timestamp: new Date().toISOString(),
      officer: 'SYSTEM',
      entry: `Incident reported by ${user.full_name}. status initialized to OPEN.`
    })]);

    // 6. Alerts & Audit
    alertService.createAlert({
      type: type === INCIDENT_TYPES.STOLEN ? 'STOLEN_EQUIPMENT' : ALERT_TYPES.EQUIPMENT_LOST,
      severity: 'CRITICAL',
      title: `${type}: ${primaryEquip.name}`,
      message: description,
      equipmentId: primaryEquipId,
      baseId: primaryEquip.home_base_id,
      metadata: { incidentNumber, reportedBy: user.full_name },
    });

    auditService.createLog({ 
      action: AUDIT_ACTIONS.INCIDENT_REPORTED, 
      performedBy: user, 
      targetEntityType: 'INCIDENT', 
      targetEntityId: incident.id, 
      targetEntityName: incidentNumber 
    });

    // Socket Emission
    emitIncidentReported(primaryEquip.home_base_id, {
      incidentId: incident.id,
      equipmentId: primaryEquipId,
      type,
      severity,
      reportedBy: user.full_name
    });

    // Notifications for witnesses
    for (const witnessId of witness_personnel_ids) {
      notificationService.notifyPersonnel(pool, witnessId, 'Witness Statement Required', `You have been listed as a witness for incident ${incidentNumber}. Please submit your statement.`);
    }

    return incident;
  });
}

/**
 * Capture Witness Statement
 */
async function captureWitnessStatement(incidentId, data, user) {
  const { statementText, signatureData, latitude, longitude } = data;

  if (statementText.length < 50) {
    throw Object.assign(new Error('Statement must be at least 50 characters'), { statusCode: 400 });
  }

  const { rows } = await pool.query(INCIDENT_QUERIES.SUBMIT_WITNESS_STATEMENT, [
    incidentId, user.id, statementText, signatureData, latitude, longitude
  ]);

  await pool.query(INCIDENT_QUERIES.ADD_INVESTIGATION_ENTRY, [incidentId, JSON.stringify({
    timestamp: new Date().toISOString(),
    officer: 'SYSTEM',
    entry: `Witness statement submitted by ${user.full_name}.`
  })]);

  return rows[0];
}

/**
 * CO Acknowledgment
 */
async function acknowledgeStolenReport(incidentId, data, user) {
  const { signatureData, acknowledgmentNotes } = data;

  const { rows } = await pool.query(INCIDENT_QUERIES.CO_ACKNOWLEDGE, [incidentId, user.id, signatureData]);
  
  if (acknowledgmentNotes) {
    await pool.query(INCIDENT_QUERIES.ADD_INVESTIGATION_ENTRY, [incidentId, JSON.stringify({
      timestamp: new Date().toISOString(),
      officer: user.full_name,
      entry: `CO Acknowledgment Notes: ${acknowledgmentNotes}`
    })]);
  }

  auditService.createLog({ 
    action: 'STOLEN_INCIDENT_CO_ACKNOWLEDGED', 
    performedBy: user, 
    targetEntityType: 'INCIDENT', 
    targetEntityId: incidentId,
    severity: 'CRITICAL'
  });

  return rows[0];
}

/**
 * Resolve Incident with Accountability Score
 */
async function resolveIncident(id, data, user) {
  return await withTransaction(async (client) => {
    const { resolution_notes, resolutions } = data; // resolutions: [{ equipment_id, outcome, blame_personnel_id }]

    const { rows: iRows } = await client.query(INCIDENT_QUERIES.GET_WITH_LINKS, [id]);
    const incident = iRows[0];

    for (const res of resolutions) {
      const deductionAmount = ACCOUNTABILITY_SCORE_DEDUCTIONS[res.outcome] || 0;
      
      await client.query(INCIDENT_QUERIES.RESOLVE_EQUIPMENT_LINK, [
        id, res.outcome, resolution_notes, res.equipment_id
      ]);

      if (res.blame_personnel_id && deductionAmount > 0) {
        await client.query(INCIDENT_QUERIES.RECORD_SCORE_EVENT, [
          res.blame_personnel_id, id, 'DEDUCTION', -deductionAmount, 
          `Incident ${incident.incident_number} resolved as ${res.outcome}`, user.id
        ]);
        await client.query(INCIDENT_QUERIES.UPDATE_PERSONNEL_SCORE, [res.blame_personnel_id, -deductionAmount]);
      }

      // Update Equipment Status back to Operational or Decommissioned
      let newStatus = EQUIPMENT_STATUS.OPERATIONAL;
      if (res.outcome.includes('PERMANENTLY_LOST') || res.outcome.includes('BEYOND_REPAIR')) {
        newStatus = EQUIPMENT_STATUS.DECOMMISSIONED;
      }
      await client.query('UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1', [res.equipment_id, newStatus]);
    }

    const { rows } = await client.query(`UPDATE incident_reports SET status = 'RESOLVED', resolved_at = NOW(), resolution_description = $2 WHERE id = $1 RETURNING *`, [id, resolution_notes]);
    
    return rows[0];
  });
}

/**
 * Add Investigation Entry
 */
async function addInvestigationEntry(incidentId, entryText, user) {
  const entry = {
    timestamp: new Date().toISOString(),
    officer: user.full_name,
    entry: entryText
  };
  const { rows } = await pool.query(INCIDENT_QUERIES.ADD_INVESTIGATION_ENTRY, [incidentId, JSON.stringify(entry)]);
  return rows[0];
}

/**
 * Upload Evidence with SHA-256 and EXIF
 */
async function uploadEvidence(incidentId, file, user) {
  const fileContent = fs.readFileSync(file.path);
  const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
  
  let exifData = {};
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    try {
      const parser = ExifParser.create(fileContent);
      const result = parser.parse();
      exifData = {
        lat: result.tags.GPSLatitude,
        lng: result.tags.GPSLongitude,
        timestamp: result.tags.DateTimeOriginal
      };
    } catch (e) {
      logger.warn('Failed to parse EXIF data', { error: e.message });
    }
  }

  const evidenceItem = {
    fileId: crypto.randomUUID(),
    originalFilename: file.originalname,
    storedFilename: file.filename,
    sha256Hash: hash,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    exifGpsLat: exifData.lat,
    exifGpsLng: exifData.lng,
    exifTimestamp: exifData.timestamp,
    uploadedByPersonnelId: user.id,
    uploadedAt: new Date().toISOString(),
    lockedAt: new Date().toISOString()
  };

  const { rows } = await pool.query(
    `UPDATE incident_reports SET evidence_integrity = evidence_integrity || $2::jsonb 
     WHERE id = $1 RETURNING *`, [incidentId, JSON.stringify(evidenceItem)]
  );
  
  return rows[0];
}

module.exports = {
  reportIncident,
  captureWitnessStatement,
  acknowledgeStolenReport,
  resolveIncident,
  addInvestigationEntry,
  uploadEvidence,
  listIncidents: async (q) => {
    // Re-implement or call existing
    const { rows } = await pool.query(INCIDENT_QUERIES.LIST);
    return rows;
  },
  getIncidentById: async (id) => {
    const { rows } = await pool.query(INCIDENT_QUERIES.GET_WITH_LINKS, [id]);
    return rows[0];
  }
};
