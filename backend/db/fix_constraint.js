
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function fix() {
  try {
    console.log('Fixing personnel role constraint...');
    await pool.query('ALTER TABLE personnel DROP CONSTRAINT IF EXISTS chk_personnel_role');
    await pool.query("ALTER TABLE personnel ADD CONSTRAINT chk_personnel_role CHECK (role IN ('SOLDIER','SERGEANT','OFFICER','QUARTERMASTER','BASE_ADMIN','AUDITOR','TECHNICIAN','SUPER_ADMIN'))");
    console.log('Constraint updated successfully to include SERGEANT');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update constraint:', err);
    process.exit(1);
  }
}

fix();
