
const router = require('express').Router();
const ctrl   = require('../controllers/checkoutRequest.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS }  = require('../constants/permissions');

router.use(authenticate);

// Soldier routes
router.post('/', ctrl.createRequest);
router.get('/my', ctrl.listMyRequests);

// Sergeant/Officer routes
router.get('/pending', authorize(PERMISSIONS.CHECKOUT_APPROVE), ctrl.listPending);
router.put('/:id/approve', authorize(PERMISSIONS.CHECKOUT_APPROVE), ctrl.approve);
router.put('/:id/reject', authorize(PERMISSIONS.CHECKOUT_APPROVE), ctrl.reject);

module.exports = router;
