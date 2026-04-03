// ============================================================
// ALERT ESCALATION JOB — Every 5 minutes
// Escalates overdue checkouts through the chain of command
// ============================================================
const { pool }         = require('../config/database');
const { emitCheckoutEscalated } = require('../events/emitters');
const { ALERT_TYPES }  = require('../constants/alertTypes');
const logger           = require('../config/logger');

const ESCALATION_THRESHOLDS = [
  { hoursOverdue: 2,  level: 1, description: 'Escalate to Field Officer' },
  { hoursOverdue: 6,  level: 2, description: 'Escalate to Quartermaster' },
  { hoursOverdue: 24, level: 3, description: 'Escalate to Base Admin — URGENT' },
];

async function runAlertEscalation() {
  try {
    const { rows: overdueList } = await pool.query(`
      SELECT cr.id, cr.equipment_id, cr.equipment_name, cr.equipment_serial,
             cr.checked_out_by_id, cr.checked_out_by_name, cr.expected_return_at,
             cr.escalation_level, cr.checkout_base_id,
             EXTRACT(EPOCH FROM (NOW() - cr.expected_return_at))/3600 AS hours_overdue
      FROM checkout_records cr
      WHERE cr.status IN ('OVERDUE','ESCALATED')
        AND cr.expected_return_at < NOW()
      ORDER BY cr.expected_return_at ASC
    `);

    for (const cr of overdueList) {
      const hours      = parseFloat(cr.hours_overdue);
      const applicable = ESCALATION_THRESHOLDS.filter(t => hours >= t.hoursOverdue && t.level > cr.escalation_level);

      if (applicable.length === 0) continue;
      const nextLevel = applicable[applicable.length - 1];

      // Escalate
      await pool.query(
        `UPDATE checkout_records SET escalation_level = $2, last_escalated_at = NOW(), status = 'ESCALATED' WHERE id = $1`,
        [cr.id, nextLevel.level]
      );

      // Find officer to notify (unit CO or base admin)
      const { rows: officers } = await pool.query(
        `SELECT id FROM personnel WHERE base_id = $1 AND role IN ('OFFICER','QUARTERMASTER','BASE_ADMIN') AND is_active = true LIMIT 1`,
        [cr.checkout_base_id]
      );
      const officerId = officers[0]?.id;

      if (officerId) emitCheckoutEscalated(officerId, {
        checkoutId:   cr.id,
        equipmentName: cr.equipment_name,
        soldierName:  cr.checked_out_by_name,
        hoursOverdue: Math.round(hours),
        level:        nextLevel.level,
        description:  nextLevel.description,
      });

      logger.warn('Checkout escalated', {
        checkoutId: cr.id, level: nextLevel.level, hoursOverdue: Math.round(hours),
      });
    }
  } catch (err) {
    logger.error('Alert escalation job failed', { error: err.message });
  }
}

module.exports = { runAlertEscalation };
