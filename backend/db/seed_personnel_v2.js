
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const password = 'Pin@1234';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the main base and first 3 units
    const { rows: bases } = await client.query('SELECT id FROM bases LIMIT 1');
    const { rows: units } = await client.query('SELECT id FROM units LIMIT 3');

    if (!bases.length || !units.length) {
      throw new Error('Need at least 1 base and 1 unit in the DB.');
    }

    const baseId = bases[0].id;
    const unitIds = units.map(u => u.id);

    console.log('Seeding Custom Test Personnel...');

    // 1. OFFICER
    const offId = uuidv4();
    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version)
        VALUES ($1, 'OFFICER-77', 'Capt. Arjun Singh', 'arjun@deas.mil', $2, 'OFFICER', 'Captain', 'B-77', $3, $4, 3, 1)
        ON CONFLICT (service_number) DO UPDATE SET password_hash = $2
    `, [offId, hash, unitIds[0], baseId]);

    // 2. SERGEANT
    const sgtId = uuidv4();
    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version, assigned_officer_id)
        VALUES ($1, 'SERGEANT-88', 'Sgt. Vikram Rathore', 'vikram@deas.mil', $2, 'SERGEANT', 'Sergeant', 'S-88', $3, $4, 2, 1, $5)
        ON CONFLICT (service_number) DO UPDATE SET password_hash = $2
    `, [sgtId, hash, unitIds[0], baseId, offId]);

    // 3. SOLDIER
    const sldId = uuidv4();
    await client.query(`
        INSERT INTO personnel (id, service_number, full_name, email, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version, assigned_sergeant_id)
        VALUES ($1, 'SOLDIER-99', 'Pvt. Rahul Sharma', 'rahul@deas.mil', $2, 'SOLDIER', 'Private', 'P-99', $3, $4, 1, 1, $5)
        ON CONFLICT (service_number) DO UPDATE SET password_hash = $2
    `, [sldId, hash, unitIds[0], baseId, sgtId]);

    await client.query('COMMIT');
    console.log('Custom personnel seeded successfully.');
    console.log('-----------------------------------');
    console.log('OFFICER:   OFFICER-77  / Pin@1234');
    console.log('SERGEANT:  SERGEANT-88 / Pin@1234');
    console.log('SOLDIER:   SOLDIER-99  / Pin@1234');
    console.log('-----------------------------------');
    
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
