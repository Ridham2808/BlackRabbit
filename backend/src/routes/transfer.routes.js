const router   = require('express').Router();
const ctrl     = require('../controllers/transfer.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { createTransferSchema, dispatchTransferSchema, receiveTransferSchema } = require('../validators/transfer.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',                     authorize(PERMISSIONS.TRANSFER_VIEW),     ctrl.list);
router.get('/:id',                  authorize(PERMISSIONS.TRANSFER_VIEW),     ctrl.getById);
router.post('/',                    authorize(PERMISSIONS.TRANSFER_REQUEST),  validate(createTransferSchema), ctrl.create);
router.patch('/:id/approve-sender', authorize(PERMISSIONS.TRANSFER_APPROVE), ctrl.approveSender);
router.patch('/:id/approve-receiver', authorize(PERMISSIONS.TRANSFER_APPROVE), ctrl.approveReceiver);
router.patch('/:id/dispatch',       authorize(PERMISSIONS.TRANSFER_DISPATCH), validate(dispatchTransferSchema), ctrl.dispatch);
router.patch('/:id/receive',        authorize(PERMISSIONS.TRANSFER_RECEIVE),  validate(receiveTransferSchema), ctrl.receive);

module.exports = router;
