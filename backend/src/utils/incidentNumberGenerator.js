// ============================================================
// INCIDENT NUMBER GENERATOR — INC-YYYY-XXXX format
// ============================================================

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique incident number in format INC-YYYY-XXXX
 * The XXXX part is taken from the last 4 chars of a UUID hex.
 */
function generateIncidentNumber() {
  const year = new Date().getFullYear();
  const suffix = uuidv4().replace(/-/g, '').slice(-5).toUpperCase();
  return `INC-${year}-${suffix}`;
}

module.exports = { generateIncidentNumber };
