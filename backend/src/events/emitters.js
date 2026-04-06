// ============================================================
// EMITTERS — Socket.io emission helper functions
// ============================================================

const { getIO }   = require('../config/socket');
const { EVENTS, rooms } = require('./eventNames');
const logger      = require('../config/logger');

function safeEmit(room, event, payload) {
  try {
    const io = getIO();
    if (!io) return;
    io.to(room).emit(event, { ...payload, _ts: Date.now() });
  } catch (err) {
    logger.warn('Socket emit failed', { room, event, error: err.message });
  }
}

// ── Equipment ────────────────────────────────────────────────

function emitEquipmentStatusChanged(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.EQUIPMENT_STATUS_CHANGED, data);
}

function emitEquipmentCreated(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.EQUIPMENT_CREATED, data);
}

function emitEquipmentUpdated(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.EQUIPMENT_UPDATED, data);
}

// ── Checkout ─────────────────────────────────────────────────

function emitCheckoutStarted(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.CHECKOUT_STARTED, data);
}

function emitCheckoutCompleted(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.CHECKOUT_COMPLETED, data);
}

function emitCheckoutOverdue(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.CHECKOUT_OVERDUE, data);
  safeEmit(rooms.admins(),      EVENTS.CHECKOUT_OVERDUE, data);
}

function emitCheckoutEscalated(officerId, data) {
  safeEmit(rooms.user(officerId), EVENTS.CHECKOUT_ESCALATED, data);
}

// ── Alerts ───────────────────────────────────────────────────

function emitAlertCreated(baseId, data, targetUserId = null) {
  safeEmit(rooms.base(baseId), EVENTS.ALERT_CREATED, data);
  if (targetUserId) {
    safeEmit(rooms.user(targetUserId), EVENTS.ALERT_CREATED, data);
  }
}

function emitAlertUpdated(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.ALERT_UPDATED, data);
}

// ── Location ─────────────────────────────────────────────────

function emitLocationPing(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.LOCATION_PING, data);
}

// ── Transfer ─────────────────────────────────────────────────

function emitTransferStatusChanged(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.TRANSFER_STATUS_CHANGED, data);
}

// ── Dashboard ────────────────────────────────────────────────

function emitDashboardStats(baseId, stats) {
  safeEmit(rooms.base(baseId), EVENTS.DASHBOARD_STATS, stats);
}

// ── Incident ─────────────────────────────────────────────────

function emitIncidentReported(baseId, data) {
  safeEmit(rooms.base(baseId), EVENTS.INCIDENT_REPORTED, data);
  safeEmit(rooms.admins(),      EVENTS.INCIDENT_REPORTED, data);
}

// ── System ───────────────────────────────────────────────────

function emitSystemNotification(userId, data) {
  safeEmit(rooms.user(userId), EVENTS.SYSTEM_NOTIFICATION, data);
}

module.exports = {
  emitEquipmentStatusChanged,
  emitEquipmentCreated,
  emitEquipmentUpdated,
  emitCheckoutStarted,
  emitCheckoutCompleted,
  emitCheckoutOverdue,
  emitCheckoutEscalated,
  emitAlertCreated,
  emitAlertUpdated,
  emitLocationPing,
  emitTransferStatusChanged,
  emitDashboardStats,
  emitIncidentReported,
  emitSystemNotification,
};
