const router   = require('express').Router();
const ctrl     = require('../controllers/personnel.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { createPersonnelSchema, updatePersonnelSchema, listPersonnelSchema } = require('../validators/personnel.validators');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/bases',  authorize(PERMISSIONS.PERSONNEL_VIEW), ctrl.listBases);
router.get('/units',  authorize(PERMISSIONS.PERSONNEL_VIEW), ctrl.listUnits);
router.get('/',       authorize(PERMISSIONS.PERSONNEL_VIEW), validate(listPersonnelSchema, 'query'), ctrl.list);
router.get('/:id',    authorize(PERMISSIONS.PERSONNEL_VIEW), ctrl.getById);
router.post('/',      authorize(PERMISSIONS.PERSONNEL_CREATE), validate(createPersonnelSchema), ctrl.create);
router.put('/:id',    authorize(PERMISSIONS.PERSONNEL_UPDATE), validate(updatePersonnelSchema), ctrl.update);
router.patch('/:id/status', authorize(PERMISSIONS.PERSONNEL_UPDATE), ctrl.toggleActive);

module.exports = router;
