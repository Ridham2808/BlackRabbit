const router   = require('express').Router();
const ctrl     = require('../controllers/alert.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',                   authorize(PERMISSIONS.ALERT_VIEW),        ctrl.list);
router.post('/',                  authorize(PERMISSIONS.ALERT_MANAGE),      ctrl.create);
router.post('/acknowledge-all',   authorize(PERMISSIONS.ALERT_ACKNOWLEDGE), ctrl.acknowledgeAll);
router.patch('/:id/acknowledge',  authorize(PERMISSIONS.ALERT_ACKNOWLEDGE), ctrl.acknowledge);
router.patch('/:id/resolve',      authorize(PERMISSIONS.ALERT_RESOLVE),     ctrl.resolve);
router.patch('/:id/dismiss',      authorize(PERMISSIONS.ALERT_DISMISS),     ctrl.dismiss);

module.exports = router;
