// ============================================================
// OFFLINE SYNC HEADER MIDDLEWARE
// Detects X-Offline-Sync: true header from mobile app
// Attaches offline metadata to req for audit and sync tracking
// ============================================================

function offlineSyncHeader(req, res, next) {
  const isOfflineSync = req.headers['x-offline-sync'] === 'true';
  const offlineCreatedAt = req.headers['x-offline-created-at'];
  const deviceId = req.headers['x-device-id'];

  req.offlineSync = {
    isOffline:   isOfflineSync,
    createdAt:   offlineCreatedAt ? new Date(offlineCreatedAt) : null,
    deviceId:    deviceId || null,
  };

  next();
}

module.exports = offlineSyncHeader;
