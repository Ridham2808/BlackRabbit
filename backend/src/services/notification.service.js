// ============================================================
// NOTIFICATION SERVICE — Push notifications via Expo Push API
// ============================================================

const logger = require('../config/logger');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPush({ token, title, body, data = {} }) {
  if (!token) return;
  const message = { to: token, sound: 'default', title, body, data };
  try {
    const res  = await fetch(EXPO_PUSH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    const json = await res.json();
    if (json.data?.status === 'error') logger.warn('Push error', { error: json.data.message });
  } catch (err) {
    logger.warn('Push send failed', { error: err.message });
  }
}

async function notifyPersonnel(pool, personnelId, title, body, data = {}) {
  const { rows } = await pool.query('SELECT device_token FROM personnel WHERE id = $1', [personnelId]);
  if (rows[0]?.device_token) await sendPush({ token: rows[0].device_token, title, body, data });
}

module.exports = { sendPush, notifyPersonnel };
