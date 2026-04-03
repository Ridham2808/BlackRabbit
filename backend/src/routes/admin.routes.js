const router   = require('express').Router();
const ctrl     = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);

router.get('/stats',            authorize(PERMISSIONS.ADMIN_BASE_CONFIG),  ctrl.systemStats);
router.post('/users',           authorize(PERMISSIONS.ADMIN_USER_MANAGE),  ctrl.createUser);
router.patch('/users/:id/role', authorize(PERMISSIONS.ADMIN_ROLE_ASSIGN),  ctrl.updateUserRole);
router.patch('/users/:id/deactivate', authorize(PERMISSIONS.ADMIN_USER_MANAGE), ctrl.deactivateUser);

module.exports = router;
