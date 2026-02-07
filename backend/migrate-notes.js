import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting migration: Converting admin_notes to JSONB array...');
    
    const migrationSQL = readFileSync(
      join(__dirname, 'drizzle', '0006_convert_admin_notes_to_jsonb.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Checking migrated data...');
    
    const result = await client.query(
      'SELECT id, store_name, admin_notes FROM vendors WHERE admin_notes IS NOT NULL AND jsonb_array_length(admin_notes) > 0'
    );
    
    console.log(`✅ Found ${result.rows.length} vendors with migrated notes`);
    result.rows.forEach(row => {
      console.log(`  - ${row.store_name}: ${JSON.stringify(row.admin_notes)}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
