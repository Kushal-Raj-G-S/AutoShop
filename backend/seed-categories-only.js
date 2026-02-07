import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function parseCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const item = {};
    headers.forEach((header, index) => {
      item[header.trim()] = values[index]?.trim() || '';
    });
    items.push(item);
  }
  
  return items;
}

async function seedCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Extracting categories from CSV...\n');

    // Parse CSV file
    const csvPath = path.join(__dirname, '..', 'sample-items-upload.csv');
    const itemsFromCsv = await parseCsvFile(csvPath);
    console.log(`  ✅ Parsed ${itemsFromCsv.length} items from CSV`);

    // Extract unique categories
    const categoryMap = new Map();
    
    itemsFromCsv.forEach(item => {
      const subCat = item.subCategory?.trim();
      if (subCat && !categoryMap.has(subCat)) {
        categoryMap.set(subCat, {
          name: subCat,
          description: `${subCat} parts and accessories`,
          imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3'
        });
      }
    });

    console.log(`  ✅ Found ${categoryMap.size} unique categories\n`);

    await client.query('BEGIN');

    // Create categories
    console.log('📂 Creating categories...\n');
    const categoryIds = [];
    
    for (const [name, category] of categoryMap) {
      try {
        const result = await client.query(
          `INSERT INTO categories (name, description, image_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET description = $2, image_url = $3
           RETURNING id, name`,
          [category.name, category.description, category.imageUrl]
        );
        categoryIds.push(result.rows[0]);
        console.log(`  ✅ ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${name}: ${error.message}`);
      }
    }

    await client.query('COMMIT');

    console.log('\n✨ Categories seeding completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total categories created: ${categoryIds.length}`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Go to admin panel: http://localhost:3000/items`);
    console.log(`   2. Click "Bulk Upload" button`);
    console.log(`   3. Upload sample-items-upload.csv`);
    console.log(`   4. Map CSV columns to database fields`);
    console.log(`   5. Select vendor and category for each item`);
    console.log(`   6. Import all items at once!`);
    console.log(`\n📋 Available categories:`);
    categoryIds.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCategories().catch(console.error);
