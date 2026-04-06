
require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    const { rows: bases } = await client.query('SELECT id FROM bases LIMIT 1');
    const { rows: units } = await client.query('SELECT id FROM units');
    const { rows: cats } = await client.query('SELECT id, name, display_name FROM equipment_categories');

    if (!bases.length || !units.length || !cats.length) {
      console.error('Missing base, unit, or categories.');
      process.exit(1);
    }

    const baseId = bases[0].id;
    const unitId = units[0].id;

    console.log('Seeding weapons...');

    const weapons = [
      { cat: 'ASSAULT_RIFLE', prefix: 'AR', count: 10, names: ['AK-47', 'AK-203', 'M4A1 Carbine', 'INSAS Rifle', 'SIG Sauer MCX'] },
      { cat: 'HANDGUN', prefix: 'HG', count: 8, names: ['Glock 17', 'Sig Sauer P320', 'Beretta M9', 'Colt 1911'] },
      { cat: 'SNIPER_RIFLE', prefix: 'SR', count: 5, names: ['AWM', 'Barrett M82', 'Sako TRG'] },
      { cat: 'RADIO_DEVICE', prefix: 'RD', count: 12, names: ['Harris Falcon III', 'Thales AN/PRC-148'] },
      { cat: 'NIGHT_VISION', prefix: 'NV', count: 10, names: ['PVS-14 Night Vision', 'GPNVG-18 Panoramic'] },
      { cat: 'DRONE', prefix: 'DR', count: 4, names: ['DJI Mavic 3 Enterprise', 'Skydio X2'] },
    ];

    await client.query('BEGIN');

    for (const unit of units) {
      console.log(`Seeding weapons for unit: ${unit.id}`);
      for (const w of weapons) {
        const category = cats.find(c => c.name === w.cat);
        if (!category) continue;

        // Reduce count per unit to avoid bloating
        const unitCount = Math.ceil(w.count / units.length) + 2;

        for (let i = 1; i <= unitCount; i++) {
          const id = uuidv4();
          const name = `${w.names[i % w.names.length]} #${Math.floor(100 + Math.random() * 900)}`;
          const serial = `${w.prefix}-${unit.id.slice(0, 4)}-${Math.floor(100000 + Math.random() * 899999)}`;
          
          await client.query(`
            INSERT INTO equipment (
              id, name, serial_number, category_id, status, condition, 
              home_base_id, home_unit_id, purchase_date, next_maintenance_due
            ) VALUES ($1, $2, $3, $4, 'OPERATIONAL', 'EXCELLENT', $5, $6, NOW(), NOW() + INTERVAL '6 months')
            ON CONFLICT (serial_number) DO NOTHING
          `, [id, name, serial, category.id, baseId, unit.id]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('Finished seeding weapons.');
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
