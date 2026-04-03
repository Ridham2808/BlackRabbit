// ============================================================
// LOCATION QUERIES
// ============================================================

const LOCATION_QUERIES = {
  INSERT_PING: `
    INSERT INTO location_pings (
      personnel_id, equipment_id, latitude, longitude,
      accuracy, altitude, speed, heading, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, latitude, longitude, created_at
  `,

  LATEST_FOR_EQUIPMENT: `
    SELECT lp.*, p.full_name AS personnel_name, p.service_number
    FROM location_pings lp
    LEFT JOIN personnel p ON p.id = lp.personnel_id
    WHERE lp.equipment_id = $1
    ORDER BY lp.created_at DESC
    LIMIT 1
  `,

  TRACK_EQUIPMENT: `
    SELECT latitude, longitude, created_at, accuracy, speed
    FROM location_pings
    WHERE equipment_id = $1
      AND created_at >= NOW() - ($2 || ' hours')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 500
  `,

  LIVE_ACTIVE_CHECKOUTS: `
    SELECT DISTINCT ON (lp.equipment_id)
      lp.equipment_id, lp.personnel_id, lp.latitude, lp.longitude,
      lp.created_at AS last_ping,
      e.name AS equipment_name, e.serial_number, e.status,
      p.full_name AS custodian_name
    FROM location_pings lp
    JOIN equipment e ON e.id = lp.equipment_id
    JOIN personnel p ON p.id = lp.personnel_id
    WHERE lp.created_at >= NOW() - INTERVAL '2 hours'
      AND e.status = 'CHECKED_OUT'
    ORDER BY lp.equipment_id, lp.created_at DESC
  `,

  STALE_EQUIPMENT: `
    SELECT e.id, e.serial_number, e.name, e.status,
           e.last_location_update_at, b.id AS base_id
    FROM equipment e
    JOIN bases b ON b.id = e.home_base_id
    WHERE e.status = 'CHECKED_OUT'
      AND (
        e.last_location_update_at IS NULL
        OR e.last_location_update_at < NOW() - INTERVAL '2 hours'
      )
      AND e.is_deleted = false
  `,
};

module.exports = { LOCATION_QUERIES };
