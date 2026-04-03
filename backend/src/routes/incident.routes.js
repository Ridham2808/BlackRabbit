const router   = require('express').Router();
const ctrl     = require('../controllers/incident.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { reportIncidentSchema, updateIncidentSchema } = require('../validators/incident.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',      authorize(PERMISSIONS.INCIDENT_VIEW),        ctrl.list);
router.get('/:id',   authorize(PERMISSIONS.INCIDENT_VIEW),        ctrl.getById);
router.post('/',     authorize(PERMISSIONS.INCIDENT_REPORT),      validate(reportIncidentSchema), ctrl.report);
router.put('/:id',   authorize(PERMISSIONS.INCIDENT_INVESTIGATE), validate(updateIncidentSchema), ctrl.update);
router.patch('/:id/close', authorize(PERMISSIONS.INCIDENT_CLOSE), ctrl.close);

module.exports = router;
