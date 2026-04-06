// ============================================================
// REPORT CONTROLLER — Full implementation with /summary endpoint
// ============================================================
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/responseFormatter');

module.exports = {
  // Used by Reports.jsx — /api/reports/summary
  async summary(req, res) {
    const { days = 30 } = req.query;
    const baseId = req.user.base_id;
    const daysInt = Math.min(parseInt(days) || 30, 365);

    const [
      totalEq, activeCheckouts, maintenanceDue, openAlerts,
      overdueCheckouts, openIncidents, checkoutEventCount,
      statusDist, unitCheckouts, checkoutActivity, maintenanceCompletion,
    ] = await Promise.all([
      // Totals
      pool.query(`SELECT COUNT(*) FROM equipment WHERE home_base_id=$1 AND is_deleted=false`, [baseId]),
      pool.query(`SELECT COUNT(*) FROM checkout_records WHERE checkout_base_id=$1 AND status='ACTIVE'`, [baseId]),
      pool.query(
        `SELECT COUNT(*) FROM equipment WHERE home_base_id=$1 AND is_deleted=false
         AND next_maintenance_due <= NOW() + INTERVAL '7 days'`, [baseId]
      ),
      pool.query(`SELECT COUNT(*) FROM alerts WHERE base_id=$1 AND status='OPEN'`, [baseId]),
      pool.query(`SELECT COUNT(*) FROM checkout_records WHERE checkout_base_id=$1 AND status='OVERDUE'`, [baseId]),
      pool.query(`SELECT COUNT(*) FROM incident_reports WHERE status='OPEN'`),
      pool.query(
        `SELECT COUNT(*) FROM checkout_records WHERE checkout_base_id=$1
         AND actual_checkout_at >= NOW() - INTERVAL '${daysInt} days'`, [baseId]
      ),

      // Status distribution pie
      pool.query(
        `SELECT status, COUNT(*) AS count FROM equipment
         WHERE home_base_id=$1 AND is_deleted=false GROUP BY status ORDER BY count DESC`, [baseId]
      ),

      // Checkout frequency per unit (bar chart)
      pool.query(
        `SELECT u.name AS unit_name, COUNT(cr.id) AS count
         FROM checkout_records cr
         JOIN personnel p ON p.id = cr.checked_out_by_id
         JOIN units u ON u.id = p.unit_id
         WHERE cr.checkout_base_id=$1
           AND cr.actual_checkout_at >= NOW() - INTERVAL '${daysInt} days'
         GROUP BY u.name ORDER BY count DESC LIMIT 10`, [baseId]
      ),

      // Daily activity area chart
      pool.query(
        `SELECT
           DATE(actual_checkout_at) AS date,
           COUNT(*) FILTER (WHERE actual_checkout_at IS NOT NULL) AS checkouts,
           COUNT(*) FILTER (WHERE actual_return_at IS NOT NULL) AS returns
         FROM checkout_records
         WHERE checkout_base_id=$1
           AND actual_checkout_at >= NOW() - INTERVAL '${daysInt} days'
         GROUP BY DATE(actual_checkout_at)
         ORDER BY date ASC`, [baseId]
      ),

      // Monthly maintenance completion line chart
      pool.query(
        `SELECT
           TO_CHAR(scheduled_date,'Mon YYYY') AS month,
           DATE_TRUNC('month',scheduled_date) AS month_start,
           ROUND(
             100.0 * COUNT(*) FILTER (WHERE status='COMPLETED') / NULLIF(COUNT(*),0),
             1
           ) AS rate
         FROM maintenance_records mr
         JOIN equipment e ON e.id = mr.equipment_id
         WHERE e.home_base_id=$1
           AND scheduled_date >= NOW() - INTERVAL '12 months'
         GROUP BY month, month_start
         ORDER BY month_start ASC`, [baseId]
      ),
    ]);

    sendSuccess(res, {
      total_equipment:        parseInt(totalEq.rows[0].count),
      active_checkouts:       parseInt(activeCheckouts.rows[0].count),
      maintenance_due:        parseInt(maintenanceDue.rows[0].count),
      open_alerts:            parseInt(openAlerts.rows[0].count),
      overdue_checkouts:      parseInt(overdueCheckouts.rows[0].count),
      open_incidents:         parseInt(openIncidents.rows[0].count),
      checkout_events_count:  parseInt(checkoutEventCount.rows[0].count),
      status_distribution:    statusDist.rows,
      unit_checkouts:         unitCheckouts.rows,
      checkout_activity:      checkoutActivity.rows,
      maintenance_completion: maintenanceCompletion.rows,
    });
  },

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
