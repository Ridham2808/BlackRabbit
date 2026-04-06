
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const password = 'Deas@2024!';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get existing base and unit IDs
    const { rows: bases } = await client.query('SELECT id FROM bases LIMIT 1');
    const { rows: units } = await client.query('SELECT id FROM units LIMIT 3');

    if (!bases.length || units.length < 3) {
      throw new Error('Need at least 1 base and 3 units in the DB.');
    }

    const baseId = bases[0].id;
    const unitIds = units.map(u => u.id);

    console.log('Seeding 2 Officers...');
    const off1Id = uuidv4();
    const off2Id = uuidv4();
    
    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version)
        VALUES ($1, 'TEST-OFF-1', 'Major Test One', 'off1@test.mil', $2, 'OFFICER', 'Major', 'T-OFF-1', $3, $4, 3, 1)
    `, [off1Id, hash, unitIds[0], baseId]);

    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version)
        VALUES ($1, 'TEST-OFF-2', 'Major Test Two', 'off2@test.mil', $2, 'OFFICER', 'Major', 'T-OFF-2', $3, $4, 3, 1)
    `, [off2Id, hash, unitIds[0], baseId]);

    console.log('Seeding 2 Sergeants...');
    const sgt1Id = uuidv4();
    const sgt2Id = uuidv4();

    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version, assigned_officer_id)
        VALUES ($1, 'TEST-SGT-1', 'Sgt Test One', 'sgt1@test.mil', $2, 'SERGEANT', 'Sergeant', 'T-SGT-1', $3, $4, 2, 1, $5)
    `, [sgt1Id, hash, unitIds[1], baseId, off1Id]);

    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version, assigned_officer_id)
        VALUES ($1, 'TEST-SGT-2', 'Sgt Test Two', 'sgt2@test.mil', $2, 'SERGEANT', 'Sergeant', 'T-SGT-2', $3, $4, 2, 1, $5)
    `, [sgt2Id, hash, unitIds[1], baseId, off1Id]);

    console.log('Seeding 4 Soldiers...');
    for (let i = 1; i <= 4; i++) {
        const sId = uuidv4();
        const sgtId = i <= 2 ? sgt1Id : sgt2Id;
        await client.query(`
            INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version, assigned_sergeant_id)
            VALUES ($1, $2, $3, $4, $5, 'SOLDIER', 'Private', $6, $7, $8, 1, 1, $9)
        `, [sId, `TEST-SLD-${i}`, `Pvt Soldier ${i}`, `sld${i}@test.mil`, hash, `T-SLD-${i}`, unitIds[2], baseId, sgtId]);
    }

    await client.query('COMMIT');
    console.log('Finished seeding.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
