const router   = require('express').Router();
const ctrl     = require('../controllers/report.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/dashboard',            authorize(PERMISSIONS.REPORT_VIEW), ctrl.dashboard);
router.get('/utilization',          authorize(PERMISSIONS.REPORT_VIEW), ctrl.utilization);
router.get('/overdue',              authorize(PERMISSIONS.REPORT_VIEW), ctrl.overdueHistory);
router.get('/maintenance-history',  authorize(PERMISSIONS.REPORT_VIEW), ctrl.maintenanceHistory);

module.exports = router;
