const router   = require('express').Router();
const ctrl     = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS }  = require('../constants/permissions');

router.use(authenticate);

// ── User management ──────────────────────────────────────────
router.get('/users',                  authorize(PERMISSIONS.ADMIN_USER_MANAGE),  ctrl.listUsers);
router.post('/users',                 authorize(PERMISSIONS.ADMIN_USER_MANAGE),  ctrl.createUser);
router.patch('/users/:id',            authorize(PERMISSIONS.ADMIN_USER_MANAGE),  ctrl.updateUser);
router.patch('/users/:id/role',       authorize(PERMISSIONS.ADMIN_ROLE_ASSIGN),  ctrl.updateUserRole);
router.patch('/users/:id/deactivate', authorize(PERMISSIONS.ADMIN_USER_MANAGE),  ctrl.deactivateUser);
router.patch('/users/:id/unlock',     authorize(PERMISSIONS.ADMIN_USER_MANAGE),  ctrl.unlockUser);

// ── Bases ────────────────────────────────────────────────────
router.get('/bases',       authorize(PERMISSIONS.ADMIN_BASE_CONFIG), ctrl.listBases);
router.post('/bases',      authorize(PERMISSIONS.ADMIN_BASE_CONFIG), ctrl.createBase);
router.patch('/bases/:id', authorize(PERMISSIONS.ADMIN_BASE_CONFIG), ctrl.updateBase);

// ── System stats ─────────────────────────────────────────────
router.get('/system-stats', authorize(PERMISSIONS.ADMIN_BASE_CONFIG), ctrl.systemStats);

module.exports = router;
