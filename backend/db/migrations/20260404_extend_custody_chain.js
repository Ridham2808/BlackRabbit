require('dotenv').config({ path: '../.env' }); // Load BEFORE importing database
const { pool } = require('../../src/config/database');
const logger = require('../../src/config/logger');

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add columns dynamically safely
    const addCol = async (col, def) => {
      await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='custody_chain' AND column_name='${col}') THEN
                ALTER TABLE custody_chain ADD COLUMN ${col} ${def};
            END IF;
        END
        $$;
      `);
    };

    await addCol('purpose', 'VARCHAR(255)');
    await addCol('condition_out', 'VARCHAR(50)');
    await addCol('condition_in', 'VARCHAR(50)');
    await addCol('duration_mins', 'INTEGER');
    await addCol('digital_sign', 'BOOLEAN DEFAULT false');
    await addCol('tamper_hash', 'VARCHAR(255)');
    await addCol('from_location', 'VARCHAR(255)');
    
    await client.query('COMMIT');
    logger.info('Migration [extend_custody_chain] applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to extend custody_chain', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  up().then(() => { console.log('Done'); process.exit(0) }).catch(err => { console.error('FATAL:', err); process.exit(1) });
}

module.exports = { up };
