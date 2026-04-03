// ============================================================
// LOCATION SERVICE
// ============================================================

const { pool }              = require('../config/database');
const { LOCATION_QUERIES }  = require('../queries/location.queries');
const { EQUIPMENT_QUERIES } = require('../queries/equipment.queries');
const { emitLocationPing }  = require('../events/emitters');

async function recordPing(data, user) {
  const { equipment_id, latitude, longitude, accuracy, altitude, speed, heading } = data;

  const { rows } = await pool.query(LOCATION_QUERIES.INSERT_PING, [
    user.id, equipment_id || null, latitude, longitude,
    accuracy, altitude, speed, heading, 'MOBILE',
  ]);

  // Update equipment last known location
  if (equipment_id) {
    await pool.query(EQUIPMENT_QUERIES.UPDATE_LOCATION, [equipment_id, latitude, longitude]);
  }

  // Emit to base room
  emitLocationPing(user.base_id, {
    personnelId:  user.id,
    personnelName: user.full_name,
    equipmentId: equipment_id,
    latitude, longitude,
    timestamp:   rows[0].created_at,
  });

  return rows[0];
}

async function getLivePositions() {
  const { rows } = await pool.query(LOCATION_QUERIES.LIVE_ACTIVE_CHECKOUTS);
  return rows;
}

async function getEquipmentTrack(equipmentId, hours = 24) {
  const { rows } = await pool.query(LOCATION_QUERIES.TRACK_EQUIPMENT, [equipmentId, hours]);
  return rows;
}

module.exports = { recordPing, getLivePositions, getEquipmentTrack };
