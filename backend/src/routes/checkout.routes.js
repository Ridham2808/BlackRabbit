const router   = require('express').Router();
const ctrl     = require('../controllers/checkout.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { createCheckoutSchema, checkInSchema } = require('../validators/checkout.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',         authorize(PERMISSIONS.CHECKOUT_VIEW),   ctrl.list);
router.get('/mine',     authorize(PERMISSIONS.CHECKOUT_VIEW),   ctrl.myCheckouts);
router.get('/:id',      authorize(PERMISSIONS.CHECKOUT_VIEW),   ctrl.getById);
router.post('/',        authorize(PERMISSIONS.CHECKOUT_CREATE), validate(createCheckoutSchema), ctrl.checkout);
router.patch('/:id/checkin', authorize(PERMISSIONS.CHECKOUT_CHECKIN), validate(checkInSchema), ctrl.checkIn);

module.exports = router;
