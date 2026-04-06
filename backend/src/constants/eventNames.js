// ============================================================
// SOCKET.IO EVENT NAMES — single source of truth
// Used by both server emitters and client listeners
// ============================================================

const EVENTS = {
  // ── Connection ─────────────────────────────────────────────
  CONNECT:                   'connect',
  DISCONNECT:                'disconnect',
  JOIN_BASE_ROOM:            'join:base',
  JOIN_UNIT_ROOM:            'join:unit',
  JOIN_USER_ROOM:            'join:user',

  // ── Equipment ──────────────────────────────────────────────
  EQUIPMENT_STATUS_CHANGED:  'equipment:status_changed',
  EQUIPMENT_LOCATION_UPDATE: 'equipment:location_update',
  EQUIPMENT_CHECKED_OUT:     'equipment:checked_out',
  EQUIPMENT_RETURNED:        'equipment:returned',
  EQUIPMENT_FLAGGED:         'equipment:flagged',

  // ── Alerts ─────────────────────────────────────────────────
  ALERT_NEW:                 'alert:new',
  ALERT_UPDATED:             'alert:updated',
  ALERT_ACKNOWLEDGED:        'alert:acknowledged',
  ALERT_RESOLVED:            'alert:resolved',
  ALERT_ESCALATED:           'alert:escalated',

  // ── Checkout ───────────────────────────────────────────────
  CHECKOUT_CREATED:          'checkout:created',
  CHECKOUT_OVERDUE:          'checkout:overdue',
  CHECKOUT_RETURNED:         'checkout:returned',
  CHECKOUT_APPROVED:         'checkout:approved',

  // ── Transfers ──────────────────────────────────────────────
  TRANSFER_REQUESTED:        'transfer:requested',
  TRANSFER_APPROVED:         'transfer:approved',
  TRANSFER_DISPATCHED:       'transfer:dispatched',
  TRANSFER_RECEIVED:         'transfer:received',

  // ── Location ───────────────────────────────────────────────
  LOCATION_PING:             'location:ping',
  LOCATION_BATCH:            'location:batch',

  // ── Dashboard ──────────────────────────────────────────────
  DASHBOARD_STATS_UPDATE:    'dashboard:stats_update',

  // ── Maintenance ────────────────────────────────────────────
  MAINTENANCE_DUE:           'maintenance:due',
  MAINTENANCE_UPDATED:       'maintenance:updated',

  // ── System ─────────────────────────────────────────────────
  SYSTEM_ANNOUNCEMENT:       'system:announcement',
  ERROR:                     'error',
};

// Room name builders — keep naming consistent
const ROOMS = {
  base:  (baseId)   => `base:${baseId}`,
  unit:  (unitId)   => `unit:${unitId}`,
  user:  (userId)   => `user:${userId}`,
  admin: ()         => 'admin:global',
};

module.exports = { EVENTS, ROOMS };
