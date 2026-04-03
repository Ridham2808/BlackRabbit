const router   = require('express').Router();
const ctrl     = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',                    authorize(PERMISSIONS.AUDIT_VIEW), ctrl.list);
router.get('/anomalies',           authorize(PERMISSIONS.AUDIT_VIEW), ctrl.anomalies);
router.get('/entity/:entityId',    authorize(PERMISSIONS.AUDIT_VIEW), ctrl.entityHistory);
router.get('/:id',                 authorize(PERMISSIONS.AUDIT_VIEW), ctrl.getById);

module.exports = router;
