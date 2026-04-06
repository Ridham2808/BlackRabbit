const router   = require('express').Router();
const ctrl     = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { scheduleMaintSchema, completeMaintenanceSchema } = require('../validators/maintenance.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',         authorize(PERMISSIONS.MAINTENANCE_VIEW),     ctrl.list);
router.get('/:id',      authorize(PERMISSIONS.MAINTENANCE_VIEW),     ctrl.getById);
router.post('/',        authorize(PERMISSIONS.MAINTENANCE_SCHEDULE), validate(scheduleMaintSchema), ctrl.schedule);
router.patch('/:id/start',    authorize(PERMISSIONS.MAINTENANCE_UPDATE), ctrl.start);
router.patch('/:id/complete', authorize(PERMISSIONS.MAINTENANCE_SIGN_OFF), validate(completeMaintenanceSchema), ctrl.complete);

module.exports = router;
