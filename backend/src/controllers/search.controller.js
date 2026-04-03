// ============================================================
// SEARCH CONTROLLER — AI vector search via Python bridge
// ============================================================
const axios = require('axios');
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/responseFormatter');

const AI_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8001';

module.exports = {
  async nlSearch(req, res) {
    const { q, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query required' });

    try {
      const { data } = await axios.post(`${AI_URL}/search/nl`, { query: q, limit: parseInt(limit) }, { timeout: 8000 });
      sendSuccess(res, data.results);
    } catch (err) {
      // Fallback to basic DB text search
      const { rows } = await pool.query(
        `SELECT id, serial_number, name, status, condition FROM equipment
         WHERE (name ILIKE $1 OR serial_number ILIKE $1 OR description ILIKE $1)
           AND is_deleted = false LIMIT $2`,
        [`%${q}%`, parseInt(limit)]
      );
      sendSuccess(res, rows);
    }
  },

  async globalSearch(req, res) {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query required' });

    const like = `%${q}%`;
    const [equipment, personnel, incidents] = await Promise.all([
      pool.query(`SELECT id, serial_number AS identifier, name, 'equipment' AS type, status FROM equipment WHERE (name ILIKE $1 OR serial_number ILIKE $1) AND is_deleted = false LIMIT 5`, [like]),
      pool.query(`SELECT id, service_number AS identifier, full_name AS name, 'personnel' AS type, role AS status FROM personnel WHERE (full_name ILIKE $1 OR service_number ILIKE $1) AND is_deleted = false LIMIT 5`, [like]),
      pool.query(`SELECT id, incident_number AS identifier, description AS name, 'incident' AS type, status FROM incident_reports WHERE (incident_number ILIKE $1 OR description ILIKE $1) LIMIT 5`, [like]),
    ]);

    sendSuccess(res, {
      equipment: equipment.rows,
      personnel: personnel.rows,
      incidents: incidents.rows,
    });
  },
};
