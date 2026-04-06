const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function setup() {
  const connectionString = process.env.DATABASE_URL;
  console.log(`Connecting to: ${connectionString}`);

  const pool = new Pool({ connectionString });

  function getErrorWithContext(err, sql, fileName) {
      if (err.position) {
          const pos = parseInt(err.position);
          const lines = sql.substring(0, pos).split('\n');
          const lineNum = lines.length;
          const colNum = lines[lines.length - 1].length;
          const surroundingLines = sql.split('\n').slice(Math.max(0, lineNum - 3), lineNum + 2);
          
          let context = `Error in ${fileName} at line ${lineNum}, column ${colNum}:\n`;
          surroundingLines.forEach((line, i) => {
              const currentLineNum = Math.max(0, lineNum - 3) + i + 1;
              context += `${currentLineNum === lineNum ? '>> ' : '   '}${currentLineNum}: ${line}\n`;
          });
          return context;
      }
      return err.message;
  }

  try {
    // 1. Read files
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log("Applying init.sql...");
    try {
        await pool.query(initSql);
        console.log("Success! Tables created.");
    } catch (err) {
        console.error(getErrorWithContext(err, initSql, 'init.sql'));
        throw err;
    }

    console.log("Applying seed.sql...");
    try {
        await pool.query(seedSql);
        console.log("Success! Data seeded.");
    } catch (err) {
        console.error(getErrorWithContext(err, seedSql, 'seed.sql'));
        throw err;
    }

  } catch (err) {
    console.error("Setup failed!");
    // console.error(err);
  } finally {
    await pool.end();
  }
}

setup();
