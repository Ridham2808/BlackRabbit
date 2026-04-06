// ============================================================
// CHECKOUT SERVICE — Checkout engine with custody chain
// ============================================================

const { pool }              = require('../config/database');
const { CHECKOUT_QUERIES }  = require('../queries/checkout.queries');
const { CHECKOUT_REQUEST_QUERIES } = require('../queries/checkoutRequest.queries');
const { EQUIPMENT_QUERIES } = require('../queries/equipment.queries');
const { EQUIPMENT_STATUS, CHECKOUT_STATUS, CUSTODY_EVENT } = require('../constants/statusTypes');
const { AUDIT_ACTIONS }     = require('../constants/alertTypes');
const { emitCheckoutStarted, emitCheckoutCompleted } = require('../events/emitters');
const auditService          = require('./audit.service');
const alertService          = require('./alert.service');
const { generateTamperHash } = require('../utils/cryptoTrace');
// ── checkout ─────────────────────────────────────────────────

async function checkout(data, user) {
  console.log(`[Backend Service] Checkout initialization started for Equipment ID: ${data.equipment_id}`);
  const {
    equipment_id, request_id, purpose, expected_return_at, condition_on_checkout,
    digital_signature_data, biometric_verified, biometric_type,
    checkout_latitude, checkout_longitude, notes, offline_timestamp, assigned_user_id
  } = data;

  if (!digital_signature_data) {
    throw Object.assign(new Error('Digital signature is required for checkout'), { statusCode: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. If request_id is provided, verify it's approved for this user and category
    let approvedById = null;
    let approvedByName = null;

    if (request_id) {
      const { rows: reqRows } = await client.query(
        `SELECT r.*, p.full_name AS approver_name 
         FROM checkout_requests r
         LEFT JOIN personnel p ON p.id = r.approved_by_id
         WHERE r.id = $1 AND r.personnel_id = $2 AND r.status = 'APPROVED' FOR UPDATE`,
        [request_id, user.id]
      );
      if (!reqRows[0]) throw Object.assign(new Error('Approved request not found for this user'), { statusCode: 404 });
      
      approvedById = reqRows[0].approved_by_id;
      approvedByName = reqRows[0].approver_name;
    }

    let targetUser = user;
    if (assigned_user_id && assigned_user_id !== user.id) {
       const ures = await client.query('SELECT id, full_name, service_number, base_id FROM personnel WHERE id = $1 AND is_deleted = false', [assigned_user_id]);
       if (!ures.rows[0]) throw Object.assign(new Error('Assigned personnel not found'), { statusCode: 404 });
       targetUser = ures.rows[0];
    }

    // 2. Lock and verify equipment row
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
      if (offline_timestamp) {
        // --- CONFLICT RESOLUTION: Rule — Earliest timestamp wins ---
        const { rows: activeCheckoutRows } = await client.query(
          `SELECT * FROM checkout_records WHERE equipment_id = $1 AND status = 'ACTIVE'`, [equipment_id]
        );
        const activeCheckout = activeCheckoutRows[0];
        
        if (activeCheckout) {
          const offlineTime = new Date(offline_timestamp);
          const activeTime = new Date(activeCheckout.actual_checkout_at);
          
          if (offlineTime < activeTime) {
            // Offline guy was FIRST. Demote the current active one.
            await client.query(`UPDATE checkout_records SET status = 'ESCALATED', escalation_level = 1, notes = 'Conflict: Preceded by offline checkout' WHERE id = $1`, [activeCheckout.id]);
            await alertService.createAlert({
              type: 'SYSTEM_ERROR', severity: 'HIGH',
              title: 'Timeline Conflict: Offline Priority',
              message: `Equipment was checked out offline by ${user.full_name} at ${offlineTime.toISOString()}, which is earlier than ${activeCheckout.checked_out_by_name}'s checkout at ${activeTime.toISOString()}. Priority granted to offline record.`,
              equipmentId: equipment_id, baseId: user.base_id
            });
          } else {
            // Server guy was FIRST. Reject this offline one.
            throw Object.assign(new Error(`Conflict: Equipment was already checked out by ${activeCheckout.checked_out_by_name} at ${activeTime.toISOString()}, prior to your offline attempt at ${offlineTime.toISOString()}.`), { statusCode: 409 });
          }
        } else {
          throw Object.assign(new Error(`Equipment is currently ${eq.status} and cannot be checked out`), { statusCode: 409 });
        }
      } else {
        throw Object.assign(new Error(`Equipment is currently ${eq.status} and cannot be checked out`), { statusCode: 409 });
      }
    }

    // 3. Insert checkout record
    console.log(`[Backend Service] Validation Passed. Creating Checkout Record...`);
    const { rows: checkoutRows } = await client.query(CHECKOUT_QUERIES.CREATE, [
      equipment_id, eq.serial_number, eq.name,
      targetUser.id, targetUser.full_name, targetUser.service_number,
      approvedById, 
      purpose || (request_id ? 'MISSION' : null), 
      expected_return_at,
      condition_on_checkout,
      digital_signature_data,
      biometric_verified || false,
      biometric_type || null,
      checkout_latitude || null,
      checkout_longitude || null,
      targetUser.base_id || user.base_id,
      request_id || null,
      offline_timestamp || null
    ]);
    const checkoutRecord = checkoutRows[0];
    console.log(`[Backend Service] Checkout Record Inserted ID: ${checkoutRecord.id}`);

    // 4. Update equipment status + custodian
    await client.query(EQUIPMENT_QUERIES.UPDATE_CUSTODIAN, [
      equipment_id, targetUser.id, checkoutRecord.id, EQUIPMENT_STATUS.CHECKED_OUT,
    ]);

    // 4.1 Update Map Tracking Ping
    if (checkout_latitude && checkout_longitude) {
      const recordedAt = offline_timestamp ? new Date(offline_timestamp) : new Date();
      await client.query(
        `INSERT INTO location_pings (
          personnel_id, equipment_id, latitude, longitude, created_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [targetUser.id, equipment_id, checkout_latitude, checkout_longitude, recordedAt]
      );
      await client.query(
        `UPDATE equipment 
         SET last_known_latitude = $1, last_known_longitude = $2, last_location_update_at = $3 
         WHERE id = $4`,
        [checkout_latitude, checkout_longitude, recordedAt, equipment_id]
      );
    }

    // 5. If request_id provided, mark as COMPLETED
    if (request_id) {
      console.log(`[Backend Service] Moving CheckoutRequest ${request_id} to COMPLETED`);
      await client.query(CHECKOUT_REQUEST_QUERIES.COMPLETE, [request_id]);
    }

    // 6. Append custody chain
    const tsOut = new Date().toISOString();
    const hashOut = generateTamperHash({
      equipment_id, event_type: CUSTODY_EVENT.CHECKED_OUT,
      from_custodian_id: null, to_custodian_id: targetUser.id,
      timestamp: tsOut, location: targetUser.base_id || user.base_id,
      condition_out: condition_on_checkout, condition_in: null
    });

    console.log(`[Backend Service] Logging Custody Chain for out-bound...`);
    await client.query(
      `INSERT INTO custody_chain (
        equipment_id, event_type, to_custodian_id, to_custodian_name,
        to_location, checkout_record_id, performed_by_id, performed_by_name, 
        latitude, longitude, purpose, condition_out, digital_sign, tamper_hash
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        equipment_id, CUSTODY_EVENT.CHECKED_OUT,
        targetUser.id, targetUser.full_name, targetUser.base_id || user.base_id,
        checkoutRecord.id, user.id, user.full_name,
        checkout_latitude, checkout_longitude,
        purpose || 'MISSION', condition_on_checkout,
        !!digital_signature_data, hashOut
      ]
    );

    console.log(`[Backend Service] DB COMMIT Successful`);
    await client.query('COMMIT');

    // 5. Async: audit log + socket emit
    auditService.createLog({
      action: AUDIT_ACTIONS.EQUIPMENT_CHECKOUT,
      performedBy: user,
      targetEntityType: 'CHECKOUT',
      targetEntityId: checkoutRecord.id,
      targetEntityName: eq.name,
      changesAfter: { status: EQUIPMENT_STATUS.CHECKED_OUT, checkedOutBy: targetUser.full_name },
    });

    emitCheckoutStarted(targetUser.base_id || user.base_id, {
      checkoutId: checkoutRecord.id,
      equipmentId: equipment_id,
      equipmentName: eq.name,
      checkedOutBy: targetUser.full_name,
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
  const { condition_on_return, return_latitude, return_longitude, notes, offline_timestamp } = data;

  const client = await pool.connect();
  try {
    console.log(`[Backend Service] DB Transaction BEGIN for Checkout ID: ${checkoutId}`);
    await client.query('BEGIN');

    // Lock checkout record
    console.log(`[Backend Service] Locking Checkout Record ID ${checkoutId}...`);
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
      checkoutId, condition_on_return, return_latitude, return_longitude, notes, offline_timestamp || null
    ]);

    // Update equipment status + clear custodian
    await client.query(
      `UPDATE equipment
       SET status = $1, current_custodian_id = NULL, current_checkout_id = NULL,
           condition = $2, total_usage_hours = total_usage_hours +
             EXTRACT(EPOCH FROM (NOW() - $3::timestamptz)) / 3600,
           updated_at = NOW()
       WHERE id = $4`,
      [EQUIPMENT_STATUS.OPERATIONAL, condition_on_return, cr.actual_checkout_at, cr.equipment_id]
    );

    // Custody chain entry
    const tsIn = new Date().toISOString();
    const durationMins = Math.floor((new Date(tsIn) - new Date(cr.actual_checkout_at)) / 60000);
    const hashIn = generateTamperHash({
      equipment_id: cr.equipment_id, event_type: CUSTODY_EVENT.RETURNED,
      from_custodian_id: cr.checked_out_by_id, to_custodian_id: null,
      timestamp: tsIn, location: 'Armory', // Simplified
      condition_out: cr.condition_on_checkout, condition_in: condition_on_return
    });

    await client.query(
      `INSERT INTO custody_chain (
        equipment_id, event_type, from_custodian_id, from_custodian_name,
        checkout_record_id, performed_by_id, performed_by_name, latitude, longitude,
        condition_out, condition_in, duration_mins, tamper_hash
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        cr.equipment_id, CUSTODY_EVENT.RETURNED,
        cr.checked_out_by_id, cr.checked_out_by_name,
        checkoutId, user.id, user.full_name,
        return_latitude, return_longitude,
        cr.condition_on_checkout, condition_on_return, durationMins, hashIn
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
