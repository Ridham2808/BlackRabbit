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

  // Emit to base room for LiveMap real-time updates
  emitLocationPing(user.base_id, {
    equipment_id,
    equipment_name: null,  // client will resolve from store
    personnelId:    user.id,
    personnelName:  user.full_name,
    latitude, longitude,
    timestamp:      rows[0].created_at,
    status: 'CHECKED_OUT',
  });

  return rows[0];
}

// Latest known GPS position per checked-out equipment — for LiveMap initial load
async function getLatestPositions(baseId) {
  const { rows } = await pool.query(`
    SELECT DISTINCT ON (e.id)
      e.id          AS equipment_id,
      e.name        AS equipment_name,
      e.serial_number,
      e.status,
      e.last_known_latitude   AS latitude,
      e.last_known_longitude  AS longitude,
      e.last_location_update_at AS recorded_at,
      p.id          AS custodian_id,
      p.full_name   AS custodian_name
    FROM equipment e
    LEFT JOIN personnel p ON p.id = e.current_custodian_id
    WHERE e.home_base_id = $1
      AND e.is_deleted = false
      AND e.last_known_latitude IS NOT NULL
      AND e.last_known_longitude IS NOT NULL
    ORDER BY e.id, e.last_location_update_at DESC
  `, [baseId]);
  return rows;
}

async function getLivePositions() {
  const { rows } = await pool.query(LOCATION_QUERIES.LIVE_ACTIVE_CHECKOUTS);
  return rows;
}

async function getEquipmentTrack(equipmentId, hours = 24) {
  const { rows } = await pool.query(LOCATION_QUERIES.TRACK_EQUIPMENT, [equipmentId, hours]);
  return rows;
}

module.exports = { recordPing, getLivePositions, getLatestPositions, getEquipmentTrack };
