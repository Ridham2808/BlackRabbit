const router   = require('express').Router();
const ctrl     = require('../controllers/equipment.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { createEquipmentSchema, updateEquipmentSchema, listEquipmentSchema } = require('../validators/equipment.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/',                  authorize(PERMISSIONS.EQUIPMENT_VIEW),         validate(listEquipmentSchema, 'query'), ctrl.list);
router.get('/stats/dashboard',   authorize(PERMISSIONS.EQUIPMENT_VIEW),         ctrl.dashboardStats);
router.get('/serial/:serial',    authorize(PERMISSIONS.EQUIPMENT_VIEW),         ctrl.getBySerial);
router.get('/:id',               authorize(PERMISSIONS.EQUIPMENT_VIEW),         ctrl.getById);
router.get('/:id/custody-chain', authorize(PERMISSIONS.EQUIPMENT_VIEW),         ctrl.getCustodyChain);
router.post('/',                 authorize(PERMISSIONS.EQUIPMENT_CREATE),        validate(createEquipmentSchema), ctrl.create);
router.put('/:id',               authorize(PERMISSIONS.EQUIPMENT_UPDATE),        validate(updateEquipmentSchema), ctrl.update);
router.post('/:id/qr',           authorize(PERMISSIONS.EQUIPMENT_QR_GENERATE),  ctrl.generateQR);
router.delete('/:id',            authorize(PERMISSIONS.EQUIPMENT_DELETE),        ctrl.remove);

module.exports = router;
