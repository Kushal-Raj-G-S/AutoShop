import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUnits() {
  try {
    const result = await pool.query('SELECT * FROM units ORDER BY name');
    console.log('Units in database:', result.rows.length);
    result.rows.forEach(unit => {
      console.log(`- ${unit.name} (${unit.abbreviation}) - Active: ${unit.is_active}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUnits();
