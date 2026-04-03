// ============================================================
// CHECKOUT SERVICE — Checkout engine with custody chain
// ============================================================

const { pool }              = require('../config/database');
const { CHECKOUT_QUERIES }  = require('../queries/checkout.queries');
const { EQUIPMENT_QUERIES } = require('../queries/equipment.queries');
const { EQUIPMENT_STATUS, CHECKOUT_STATUS, CUSTODY_EVENT } = require('../constants/statusTypes');
const { AUDIT_ACTIONS }     = require('../constants/alertTypes');
const { emitCheckoutStarted, emitCheckoutCompleted } = require('../events/emitters');
const auditService          = require('./audit.service');
const alertService          = require('./alert.service');

// ── checkout ─────────────────────────────────────────────────

async function checkout(data, user) {
  const {
    equipment_id, purpose, expected_return_at, condition_on_checkout,
    digital_signature_data, biometric_verified, biometric_type,
    checkout_latitude, checkout_longitude, notes,
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock and verify equipment row
    const { rows: equip } = await client.query(
      `SELECT e.*, ec.requires_officer_approval, ec.max_checkout_hours
       FROM equipment e
       JOIN equipment_categories ec ON ec.id = e.category_id
       WHERE e.id = $1 AND e.is_deleted = false FOR UPDATE`,
      [equipment_id]
    );
    if (!equip[0]) throw Object.assign(new Error('Equipment not found'), { statusCode: 404 });

    const eq = equip[0];
    if (eq.status !== EQUIPMENT_STATUS.OPERATIONAL) {
      throw Object.assign(new Error(`Equipment is currently ${eq.status} and cannot be checked out`), { statusCode: 409 });
    }

    // 2. Insert checkout record
    const { rows: checkoutRows } = await client.query(CHECKOUT_QUERIES.CREATE, [
      equipment_id, eq.serial_number, eq.name,
      user.id, user.full_name, user.service_number,
      null, // approvedBy — set after officer approval flow if needed
      purpose, expected_return_at,
      condition_on_checkout,
      digital_signature_data || null,
      biometric_verified || false,
      biometric_type || null,
      checkout_latitude || null,
      checkout_longitude || null,
      user.base_id,
    ]);
    const checkoutRecord = checkoutRows[0];

    // 3. Update equipment status + custodian
    await client.query(EQUIPMENT_QUERIES.UPDATE_CUSTODIAN, [
      equipment_id, user.id, checkoutRecord.id, EQUIPMENT_STATUS.CHECKED_OUT,
    ]);

    // 4. Append custody chain
    await client.query(
      `INSERT INTO custody_chain (equipment_id, event_type, to_custodian_id, to_custodian_name,
        to_location, checkout_record_id, performed_by_id, performed_by_name, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        equipment_id, CUSTODY_EVENT.CHECKED_OUT,
        user.id, user.full_name, user.base_id,
        checkoutRecord.id, user.id, user.full_name,
        checkout_latitude, checkout_longitude,
      ]
    );

    await client.query('COMMIT');

    // 5. Async: audit log + socket emit
    auditService.createLog({
      action: AUDIT_ACTIONS.EQUIPMENT_CHECKOUT,
      performedBy: user,
      targetEntityType: 'CHECKOUT',
      targetEntityId: checkoutRecord.id,
      targetEntityName: eq.name,
      changesAfter: { status: EQUIPMENT_STATUS.CHECKED_OUT, checkedOutBy: user.full_name },
    });

    emitCheckoutStarted(user.base_id, {
      checkoutId: checkoutRecord.id,
      equipmentId: equipment_id,
      equipmentName: eq.name,
      checkedOutBy: user.full_name,
      expectedReturn: expected_return_at,
    });

    return checkoutRecord;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── checkIn ───────────────────────────────────────────────────

async function checkIn(checkoutId, data, user) {
  const { condition_on_return, return_latitude, return_longitude, notes } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock checkout record
    const { rows: crRows } = await client.query(
      `SELECT * FROM checkout_records WHERE id = $1 FOR UPDATE`, [checkoutId]
    );
    const cr = crRows[0];
    if (!cr) throw Object.assign(new Error('Checkout not found'), { statusCode: 404 });
    if (cr.status === CHECKOUT_STATUS.RETURNED) {
      throw Object.assign(new Error('Equipment already returned'), { statusCode: 409 });
    }

    // Update checkout record
    const { rows: updated } = await client.query(CHECKOUT_QUERIES.CHECK_IN, [
      checkoutId, condition_on_return, return_latitude, return_longitude, notes,
    ]);

    // Update equipment status + clear custodian
    await client.query(
      `UPDATE equipment
       SET status = $2, current_custodian_id = NULL, current_checkout_id = NULL,
           condition = $3, total_usage_hours = total_usage_hours +
             EXTRACT(EPOCH FROM (NOW() - $4::timestamptz)) / 3600,
           updated_at = NOW()
       WHERE id = $5`,
      [null, EQUIPMENT_STATUS.OPERATIONAL, condition_on_return, cr.actual_checkout_at, cr.equipment_id]
    );

    // Custody chain entry
    await client.query(
      `INSERT INTO custody_chain (equipment_id, event_type, from_custodian_id, from_custodian_name,
        checkout_record_id, performed_by_id, performed_by_name, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        cr.equipment_id, CUSTODY_EVENT.RETURNED,
        cr.checked_out_by_id, cr.checked_out_by_name,
        checkoutId, user.id, user.full_name,
        return_latitude, return_longitude,
      ]
    );

    await client.query('COMMIT');

    auditService.createLog({
      action: AUDIT_ACTIONS.EQUIPMENT_CHECKIN,
      performedBy: user,
      targetEntityType: 'CHECKOUT',
      targetEntityId: checkoutId,
      targetEntityName: cr.equipment_name,
    });

    emitCheckoutCompleted(user.base_id, { checkoutId, equipmentId: cr.equipment_id, equipmentName: cr.equipment_name });

    return updated[0];

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── list / getById ────────────────────────────────────────────

async function listCheckouts(user, query = {}) {
  const { page = 1, limit = 20, status, equipment_id, my_checkouts } = query;
  let where  = '';
  let params = [];
  let pIdx   = 1;

  if (status)       { where += ` AND cr.status = $${pIdx++}`;        params.push(status); }
  if (equipment_id) { where += ` AND cr.equipment_id = $${pIdx++}`;  params.push(equipment_id); }
  if (my_checkouts) { where += ` AND cr.checked_out_by_id = $${pIdx++}`; params.push(user.id); }

  const offset = (page - 1) * limit;
  const sql    = `${CHECKOUT_QUERIES.LIST} ${where} ORDER BY cr.actual_checkout_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getCheckoutById(id) {
  const { rows } = await pool.query(CHECKOUT_QUERIES.GET_BY_ID, [id]);
  if (!rows[0]) throw Object.assign(new Error('Checkout not found'), { statusCode: 404 });
  return rows[0];
}

module.exports = { checkout, checkIn, listCheckouts, getCheckoutById };
