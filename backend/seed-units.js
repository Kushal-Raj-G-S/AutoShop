import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const defaultUnits = [
  { name: 'Piece', abbreviation: 'pcs', description: 'Individual pieces or items' },
  { name: 'Box', abbreviation: 'box', description: 'Boxed items' },
  { name: 'Carton', abbreviation: 'carton', description: 'Carton packaging' },
  { name: 'Dozen', abbreviation: 'dz', description: 'Set of 12 items' },
  { name: 'Pair', abbreviation: 'pair', description: 'Set of 2 items' },
  { name: 'Set', abbreviation: 'set', description: 'Complete set of items' },
  { name: 'Liter', abbreviation: 'L', description: 'Volume measurement' },
  { name: 'Milliliter', abbreviation: 'mL', description: 'Volume measurement' },
  { name: 'Kilogram', abbreviation: 'kg', description: 'Weight measurement' },
  { name: 'Gram', abbreviation: 'g', description: 'Weight measurement' },
  { name: 'Meter', abbreviation: 'm', description: 'Length measurement' },
];

async function seedUnits() {
  try {
    console.log('🌱 Seeding default units...');
    
    for (const unit of defaultUnits) {
      await pool.query(
        `INSERT INTO units (name, abbreviation, description, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        [unit.name, unit.abbreviation, unit.description]
      );
      console.log(`✅ Added: ${unit.name} (${unit.abbreviation})`);
    }
    
    const result = await pool.query('SELECT COUNT(*) as count FROM units');
    console.log(`\n✅ Total units in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding units:', error.message);
  } finally {
    await pool.end();
  }
}

seedUnits();
