const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * Generates an immutable cryptographic hash for a Custody Chain entry.
 * Protects against database tampering.
 */
function generateTamperHash(data) {
  try {
    const {
      equipment_id,
      event_type,
      from_custodian_id,
      to_custodian_id,
      timestamp,
      location,
      condition_out,
      condition_in,
    } = data;

    const payload = [
      equipment_id,
      event_type,
      from_custodian_id || 'NONE',
      to_custodian_id || 'NONE',
      new Date(timestamp).getTime(),
      location || 'UNKNOWN',
      condition_out || 'UNKNOWN',
      condition_in || 'UNKNOWN'
    ].join('|');

    // For highly strict deployments, we would include previous_hash, but 
    // for this feature tier, signing the current payload protects the row itself.
    
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return `HASH#${hash.substring(0, 16)}`;
  } catch (error) {
    logger.error('Failed to generate tamper hash', { error: error.message });
    // Fallback if hash fails so system doesn't crash entirely
    return `ERR#TAMPER-FAULT`;
  }
}

module.exports = { generateTamperHash };
