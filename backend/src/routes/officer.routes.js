// ============================================================
// OFFICER ROUTES — Account creation + command management
// ============================================================

const router = require('express').Router();
const ctrl   = require('../controllers/officer.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS }  = require('../constants/permissions');

router.use(authenticate);
router.use(authorize(PERMISSIONS.ADMIN_USER_MANAGE)); // All officer routes require ADMIN_USER_MANAGE

// ── Account creation (Officer Admin Panel) ───────────────────
router.post('/create-sergeant', ctrl.createSergeant);
router.post('/create-soldier',  ctrl.createSoldier);

// ── Command overview ─────────────────────────────────────────
router.get('/sergeants',         ctrl.getAllSergeants);
router.get('/sergeants/:id',     ctrl.getSergeantById);
router.get('/soldiers',          ctrl.getAllSoldiers);
router.get('/soldiers/:id',      ctrl.getSoldierById);

// ── Assignment management ─────────────────────────────────────
router.put('/soldiers/:id/assign-sergeant', ctrl.assignSergeant);

// ── Public: list bases and units (used by signup form) ───────
// (No auth needed for listing available bases/units)
router.get('/bases-list', ctrl.listBases);
router.get('/units-list',  ctrl.listUnits);

module.exports = router;
