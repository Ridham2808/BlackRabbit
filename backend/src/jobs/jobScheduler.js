// ============================================================
// JOB SCHEDULER — Registers all cron jobs with node-cron
// ============================================================
const cron   = require('node-cron');
const logger = require('../config/logger');

const { runOverdueDetection }  = require('./overdueDetection.job');
const { runMaintenanceReminder } = require('./maintenanceReminder.job');
const { runLocationStaleness } = require('./locationStaleness.job');
const { runAlertEscalation }   = require('./alertEscalation.job');

function startAllJobs() {
  // Every 5 minutes — check for overdue checkouts
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running: overdueDetection');
    await runOverdueDetection();
  });

  // Every 5 minutes — escalate long-overdue checkouts
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running: alertEscalation');
    await runAlertEscalation();
  });

  // Every day at 01:00 — maintenance due reminders
  cron.schedule('0 1 * * *', async () => {
    logger.info('Running: maintenanceReminder');
    await runMaintenanceReminder();
  });

  // Every hour — location staleness check
  cron.schedule('0 * * * *', async () => {
    logger.debug('Running: locationStaleness');
    await runLocationStaleness();
  });

  logger.info('All cron jobs scheduled');
}

module.exports = { startAllJobs };
