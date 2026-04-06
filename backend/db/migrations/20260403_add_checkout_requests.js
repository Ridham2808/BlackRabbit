
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating checkout_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkout_requests (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipment_category_id UUID NOT NULL REFERENCES equipment_categories(id),
        personnel_id         UUID NOT NULL REFERENCES personnel(id),
        purpose              VARCHAR(30) NOT NULL,
        expected_return_at   TIMESTAMPTZ NOT NULL,
        location             VARCHAR(200),
        status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        approved_by_id       UUID REFERENCES personnel(id),
        rejection_reason     TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
        CONSTRAINT chk_request_purpose CHECK (purpose IN ('MISSION', 'TRAINING', 'MAINTENANCE', 'INSPECTION', 'EXERCISE', 'EMERGENCY'))
      );
    `);

    console.log('Adding request_id to checkout_records...');
    await client.query(`
      ALTER TABLE checkout_records ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES checkout_requests(id);
    `);

    console.log('Creating triggers for updated_at...');
    await client.query(`
      DROP TRIGGER IF EXISTS set_request_updated_at ON checkout_requests;
      CREATE TRIGGER set_request_updated_at
        BEFORE UPDATE ON checkout_requests
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
