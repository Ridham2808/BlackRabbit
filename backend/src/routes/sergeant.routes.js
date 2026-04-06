// ============================================================
// SERGEANT ROUTES — Unit management & checkout approvals
// ============================================================

const router = require('express').Router();
const ctrl   = require('../controllers/sergeant.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { PERMISSIONS }  = require('../constants/permissions');

router.use(authenticate);
router.use(authorize(PERMISSIONS.CHECKOUT_APPROVE)); // Minimum sergeant permission

// ── My Soldiers ──────────────────────────────────────────────
router.get('/my-soldiers',       ctrl.getMySoldiers);
router.get('/my-soldiers/:id',   ctrl.getSoldierById);

// ── Checkout Requests ────────────────────────────────────────
router.get('/checkout-requests',              ctrl.getCheckoutRequests);
router.put('/checkout-requests/:id/approve',  ctrl.approveCheckout);
router.put('/checkout-requests/:id/reject',   ctrl.rejectCheckout);

// ── Unit Inventory ───────────────────────────────────────────
router.get('/unit-inventory',    ctrl.getUnitInventory);

// ── Location — all unit guns with history ────────────────────
router.get('/location/unit-guns', ctrl.getUnitGunLocations);

// ── Ammo Reports ─────────────────────────────────────────────
router.get('/ammo-reports',      ctrl.getAmmoReports);

// ── Maintenance ──────────────────────────────────────────────
router.post('/maintenance/flag/:equipmentId', ctrl.flagForMaintenance);

// ── Unit Audit ───────────────────────────────────────────────
router.get('/audit',             ctrl.getUnitAudit);

module.exports = router;
