const router   = require('express').Router();
const ctrl     = require('../controllers/location.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { locationPingSchema } = require('../validators/location.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.post('/ping',                    authorize(PERMISSIONS.LOCATION_PING), validate(locationPingSchema), ctrl.ping);
router.get('/live',                     authorize(PERMISSIONS.LOCATION_VIEW), ctrl.livePositions);
router.get('/equipment/:equipmentId',   authorize(PERMISSIONS.LOCATION_VIEW), ctrl.equipmentTrack);

module.exports = router;
