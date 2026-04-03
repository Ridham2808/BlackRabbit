// ============================================================
// REPORT CONTROLLER
// ============================================================
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/responseFormatter');

module.exports = {
  async dashboard(req, res) {
    const baseId = req.user.base_id;
    const [equipStats, checkoutStats, alertStats, maintenanceStats] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) AS count FROM equipment WHERE home_base_id = $1 AND is_deleted = false GROUP BY status`, [baseId]),
      pool.query(`SELECT status, COUNT(*) AS count FROM checkout_records WHERE checkout_base_id = $1 GROUP BY status`, [baseId]),
      pool.query(`SELECT severity, COUNT(*) AS count FROM alerts WHERE base_id = $1 AND status = 'OPEN' GROUP BY severity`, [baseId]),
      pool.query(`SELECT status, COUNT(*) AS count FROM maintenance_records mr JOIN equipment e ON e.id = mr.equipment_id WHERE e.home_base_id = $1 GROUP BY mr.status`, [baseId]),
    ]);

    sendSuccess(res, {
      equipment:   equipStats.rows,
      checkouts:   checkoutStats.rows,
      alerts:      alertStats.rows,
      maintenance: maintenanceStats.rows,
    });
  },

  async utilization(req, res) {
    const { start_date, end_date, base_id } = req.query;
    const { rows } = await pool.query(`
      SELECT e.id, e.name, e.serial_number,
             COUNT(cr.id) AS checkout_count,
             COALESCE(SUM(e.total_usage_hours), 0) AS total_hours,
             ec.name AS category
      FROM equipment e
      JOIN equipment_categories ec ON ec.id = e.category_id
      LEFT JOIN checkout_records cr ON cr.equipment_id = e.id
        AND ($1::date IS NULL OR cr.actual_checkout_at >= $1::date)
        AND ($2::date IS NULL OR cr.actual_checkout_at <= $2::date)
      WHERE e.home_base_id = $3 AND e.is_deleted = false
      GROUP BY e.id, ec.name
      ORDER BY checkout_count DESC
      LIMIT 50
    `, [start_date || null, end_date || null, base_id || req.user.base_id]);
    sendSuccess(res, rows);
  },

  async overdueHistory(req, res) {
    const { rows } = await pool.query(`
      SELECT cr.*, e.name AS equipment_name
      FROM checkout_records cr
      JOIN equipment e ON e.id = cr.equipment_id
      WHERE cr.status IN ('OVERDUE','ESCALATED')
        AND cr.checkout_base_id = $1
      ORDER BY cr.expected_return_at ASC
      LIMIT 100
    `, [req.user.base_id]);
    sendSuccess(res, rows);
  },

  async maintenanceHistory(req, res) {
    const { equipment_id } = req.query;
    let sql    = `SELECT mr.*, e.name AS equipment_name FROM maintenance_records mr JOIN equipment e ON e.id = mr.equipment_id WHERE 1=1`;
    let params = [];
    if (equipment_id) { sql += ` AND mr.equipment_id = $1`; params.push(equipment_id); }
    sql += ` ORDER BY mr.scheduled_date DESC LIMIT 100`;
    const { rows } = await pool.query(sql, params);
    sendSuccess(res, rows);
  },
};
