// ============================================================
// EVENT NAMES — All Socket.io event name strings
// ============================================================

const EVENTS = {
  // Equipment
  EQUIPMENT_STATUS_CHANGED:   'equipment:status_changed',
  EQUIPMENT_CREATED:          'equipment:created',
  EQUIPMENT_UPDATED:          'equipment:updated',

  // Checkout
  CHECKOUT_STARTED:           'checkout:started',
  CHECKOUT_COMPLETED:         'checkout:completed',
  CHECKOUT_OVERDUE:           'checkout:overdue',
  CHECKOUT_ESCALATED:         'checkout:escalated',

  // Alerts
  ALERT_CREATED:              'alert:created',
  ALERT_UPDATED:              'alert:updated',
  ALERT_ACKNOWLEDGED:         'alert:acknowledged',
  ALERT_RESOLVED:             'alert:resolved',

  // Maintenance
  MAINTENANCE_SCHEDULED:      'maintenance:scheduled',
  MAINTENANCE_COMPLETED:      'maintenance:completed',

  // Transfers
  TRANSFER_REQUESTED:         'transfer:requested',
  TRANSFER_APPROVED:          'transfer:approved',
  TRANSFER_STATUS_CHANGED:    'transfer:status_changed',

  // GPS / Location
  LOCATION_PING:              'location:ping',
  LOCATION_UPDATED:           'location:updated',

  // Dashboard live stats
  DASHBOARD_STATS:            'dashboard:stats',

  // Incident
  INCIDENT_REPORTED:          'incident:reported',

  // System
  SYSTEM_NOTIFICATION:        'system:notification',
  USER_CONNECTED:             'user:connected',
  USER_DISCONNECTED:          'user:disconnected',
};

// Socket.io room naming helpers
const rooms = {
  base:      (baseId)      => `base:${baseId}`,
  unit:      (unitId)      => `unit:${unitId}`,
  user:      (userId)      => `user:${userId}`,
  equipment: (equipmentId) => `equipment:${equipmentId}`,
  admins:    ()            => 'admins',
};

module.exports = { EVENTS, rooms };
