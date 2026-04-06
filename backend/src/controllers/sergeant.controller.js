// ============================================================
// SERGEANT CONTROLLER — Unit management
// ============================================================

const { pool }        = require('../config/database');
const { sendSuccess } = require('../utils/responseFormatter');
const { catchAsync }  = require('../utils/catchAsync');

// ── My Soldiers ──────────────────────────────────────────────
const getMySoldiers = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      p.id, p.service_number, p.full_name, p.email, p.rank, p.badge_number,
      p.is_active, p.last_login_at, p.created_at,
      u.name as unit_name, b.name as base_name,
      -- Current equipment
      (SELECT json_agg(json_build_object(
        'id', e.id, 'name', e.name, 'serial_number', e.serial_number,
        'status', e.status, 'condition', e.condition
      ))
       FROM equipment e WHERE e.current_custodian_id = p.id AND e.is_deleted = false
      ) as assigned_equipment,
      -- Active checkouts count
      (SELECT COUNT(*) FROM checkout_records cr 
       WHERE cr.checked_out_by_id = p.id AND cr.status = 'ACTIVE') as active_checkouts
    FROM personnel p
    LEFT JOIN units u ON p.unit_id = u.id
    LEFT JOIN bases b ON p.base_id = b.id
    WHERE p.assigned_sergeant_id = $1
      AND p.is_deleted = false
      AND p.role = 'SOLDIER'
    ORDER BY p.full_name ASC
  `, [req.user.id]);

  sendSuccess(res, rows, 'Soldiers retrieved');
});

// ── Get Soldier by ID (must be MY soldier) ────────────────────
const getSoldierById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(`
    SELECT 
      p.*, u.name as unit_name, b.name as base_name,
      -- Checkout history
      (SELECT json_agg(cr ORDER BY cr.actual_checkout_at DESC)
       FROM checkout_records cr WHERE cr.checked_out_by_id = p.id LIMIT 20
      ) as checkout_history,
      -- Assigned equipment
      (SELECT json_agg(json_build_object(
        'id', e.id, 'name', e.name, 'serial_number', e.serial_number,
        'status', e.status, 'condition', e.condition, 'category', ec.display_name
      ))
       FROM equipment e
       LEFT JOIN equipment_categories ec ON ec.id = e.category_id
       WHERE e.current_custodian_id = p.id AND e.is_deleted = false
      ) as assigned_equipment
    FROM personnel p
    LEFT JOIN units u ON p.unit_id = u.id
    LEFT JOIN bases b ON p.base_id = b.id
    WHERE p.id = $1 
      AND p.assigned_sergeant_id = $2
      AND p.role = 'SOLDIER'
      AND p.is_deleted = false
  `, [id, req.user.id]);

  if (!rows[0]) return res.status(404).json({ success: false, message: 'Soldier not found or not under your command' });
  sendSuccess(res, rows[0], 'Soldier retrieved');
});

// ── Pending Checkout Requests from my soldiers ────────────────
const getCheckoutRequests = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT cr.*, 
      p.assigned_sergeant_id
    FROM checkout_records cr
    JOIN personnel p ON p.id = cr.checked_out_by_id
    WHERE p.assigned_sergeant_id = $1
      AND cr.approved_by_id IS NULL
      AND cr.status IN ('ACTIVE','OVERDUE')
    ORDER BY cr.actual_checkout_at DESC
  `, [req.user.id]);

  sendSuccess(res, rows, 'Checkout requests retrieved');
});

// ── Approve Checkout ─────────────────────────────────────────
const approveCheckout = catchAsync(async (req, res) => {
  const { id } = req.params;
  await pool.query(`
    UPDATE checkout_records
    SET approved_by_id = $1, approved_by_name = $2, status = 'ACTIVE'
    WHERE id = $3
  `, [req.user.id, req.user.serviceNumber, id]);
  sendSuccess(res, null, 'Checkout approved');
});

// ── Reject Checkout ──────────────────────────────────────────
const rejectCheckout = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  await pool.query(`
    UPDATE checkout_records
    SET status = 'RETURNED', return_notes = $1, actual_return_at = NOW()
    WHERE id = $2
  `, [reason || 'Rejected by Sergeant', id]);
  sendSuccess(res, null, 'Checkout rejected');
});

// ── Unit Inventory (my unit only) ────────────────────────────
const getUnitInventory = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT e.id, e.serial_number, e.name, e.status, e.condition,
      e.last_known_latitude, e.last_known_longitude, e.last_location_update_at,
      ec.display_name as category, ec.criticality_level,
      p.full_name as custodian_name, p.badge_number as custodian_badge
    FROM equipment e
    LEFT JOIN equipment_categories ec ON ec.id = e.category_id
    LEFT JOIN personnel p ON p.id = e.current_custodian_id
    WHERE e.home_unit_id = $1
      AND e.is_deleted = false
    ORDER BY ec.criticality_level DESC, e.name ASC
  `, [req.user.unitId]);

  sendSuccess(res, rows, 'Unit inventory retrieved');
});

// ── Unit Gun Locations (all unit guns + movement history) ─────
const getUnitGunLocations = catchAsync(async (req, res) => {
  // Latest ping per equipment in this unit
  const { rows: liveLocations } = await pool.query(`
    SELECT DISTINCT ON (lp.equipment_id)
      lp.equipment_id, lp.latitude, lp.longitude, lp.timestamp,
      lp.accuracy_meters, lp.speed_kmph,
      e.name as equipment_name, e.serial_number,
      e.status as equipment_status,
      p.full_name as holder_name, p.badge_number as holder_badge
    FROM location_pings lp
    JOIN equipment e ON e.id = lp.equipment_id
    JOIN personnel p ON p.id = lp.personnel_id
    WHERE e.home_unit_id = $1
    ORDER BY lp.equipment_id, lp.timestamp DESC
  `, [req.user.unitId]);

  // Last 20 pings per equipment for trail
  const { rows: history } = await pool.query(`
    SELECT lp.equipment_id, lp.latitude, lp.longitude, lp.timestamp, lp.speed_kmph
    FROM location_pings lp
    JOIN equipment e ON e.id = lp.equipment_id
    WHERE e.home_unit_id = $1
    ORDER BY lp.equipment_id, lp.timestamp DESC
    LIMIT 200
  `, [req.user.unitId]);

  // Group history by equipment_id
  const historyMap = {};
  history.forEach(h => {
    if (!historyMap[h.equipment_id]) historyMap[h.equipment_id] = [];
    historyMap[h.equipment_id].push(h);
  });

  const result = liveLocations.map(loc => ({
    ...loc,
    history: historyMap[loc.equipment_id] || [],
  }));

  sendSuccess(res, result, 'Unit gun locations retrieved');
});

// ── Ammo Reports ─────────────────────────────────────────────
const getAmmoReports = catchAsync(async (req, res) => {
  // Simplified: returns checkout records for ammo-type equipment for my soldiers
  const { rows } = await pool.query(`
    SELECT cr.id, cr.equipment_name, cr.equipment_serial,
      cr.checked_out_by_name, cr.actual_checkout_at, cr.actual_return_at,
      cr.status, cr.notes,
      p.badge_number as soldier_badge
    FROM checkout_records cr
    JOIN personnel p ON p.id = cr.checked_out_by_id
    WHERE p.assigned_sergeant_id = $1
    ORDER BY cr.actual_checkout_at DESC
    LIMIT 50
  `, [req.user.id]);

  sendSuccess(res, rows, 'Ammo reports retrieved');
});

// ── Flag for Maintenance ─────────────────────────────────────
const flagForMaintenance = catchAsync(async (req, res) => {
  const { equipmentId } = req.params;
  const { reason }      = req.body;

  await pool.query(`
    UPDATE equipment SET status = 'FLAGGED', notes = $1 WHERE id = $2
  `, [reason || 'Flagged by sergeant for maintenance', equipmentId]);

  sendSuccess(res, null, 'Equipment flagged for maintenance');
});

// ── Unit Audit History ───────────────────────────────────────
const getUnitAudit = catchAsync(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT al.action, al.performed_by_name, al.performed_by_role,
      al.target_entity_name, al.severity, al.timestamp, al.ip_address
    FROM audit_logs al
    WHERE al.performed_by_id IN (
      SELECT id FROM personnel WHERE unit_id = $1
    )
    ORDER BY al.timestamp DESC
    LIMIT 100
  `, [req.user.unitId]);

  sendSuccess(res, rows, 'Unit audit log retrieved');
});

module.exports = {
  getMySoldiers,
  getSoldierById,
  getCheckoutRequests,
  approveCheckout,
  rejectCheckout,
  getUnitInventory,
  getUnitGunLocations,
  getAmmoReports,
  flagForMaintenance,
  getUnitAudit,
};
