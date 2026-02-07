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

// Categories for auto parts
const categoryData = [
  {
    name: "Auto Parts & Accessories",
    description: "Automotive parts, filters, lubricants, and accessories",
    imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3"
  },
  {
    name: "Electronics & Electricals",
    description: "Batteries, bulbs, and electrical components",
    imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60"
  },
  {
    name: "Tires & Wheels",
    description: "Premium tires and wheel accessories",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"
  }
];

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

async function seedCategoriesAndItems() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting categories and items seeding...\n');

    await client.query('BEGIN');

    // 1. Create Categories
    console.log('📂 Creating categories...');
    const categoryIds = [];
    
    for (const category of categoryData) {
      const result = await client.query(
        `INSERT INTO categories (name, description, image_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = $2, image_url = $3
         RETURNING id`,
        [category.name, category.description, category.imageUrl]
      );
      categoryIds.push(result.rows[0].id);
      console.log(`  ✅ Created category: ${category.name} (ID: ${result.rows[0].id})`);
    }

    // 2. Get all vendors
    console.log('\n📦 Loading vendors...');
    const vendorsResult = await client.query('SELECT id, store_name FROM vendors ORDER BY id');
    const vendors = vendorsResult.rows;
    console.log(`  ✅ Found ${vendors.length} vendors`);

    if (vendors.length === 0) {
      throw new Error('No vendors found! Please run seed-bangalore-vendors.js first');
    }

    // 3. Parse CSV file
    console.log('\n📄 Reading items from CSV...');
    const csvPath = path.join(__dirname, 'sample-items-upload.csv');
    const itemsFromCsv = await parseCsvFile(csvPath);
    console.log(`  ✅ Parsed ${itemsFromCsv.length} items from CSV`);

    // 4. Create items for each vendor
    console.log('\n📦 Creating items for vendors...');
    let totalItemsCreated = 0;

    for (const vendor of vendors) {
      console.log(`\n  📍 Adding items for: ${vendor.store_name}`);
      
      for (const csvItem of itemsFromCsv) {
        // Map categoryId from CSV to actual category ID
        const categoryId = categoryIds[0]; // Default to first category (Auto Parts)
        
        // Generate slug from name
        const slug = csvItem.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + `-${vendor.id}-${csvItem.sku}`;

        // Add slight price variation per vendor (±5%)
        const basePrice = parseFloat(csvItem.price);
        const priceVariation = 1 + (Math.random() * 0.1 - 0.05);
        const vendorPrice = Math.round(basePrice * priceVariation);

        try {
          await client.query(
            `INSERT INTO items (
              category_id, name, slug, sku, brand, sub_category, description,
              price, tax, service_time, unit_type, stock, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              categoryId,
              csvItem.name,
              slug,
              `${csvItem.sku}-V${vendor.id}`,
              csvItem.brand,
              csvItem.subCategory,
              csvItem.description,
              vendorPrice.toString(),
              csvItem.tax,
              parseInt(csvItem.serviceTime) || 0,
              csvItem.unitType,
              parseInt(csvItem.stock) || 0,
              'true'
            ]
          );
          totalItemsCreated++;
        } catch (error) {
          console.error(`    ❌ Failed to create ${csvItem.name}: ${error.message}`);
        }
      }
      
      console.log(`    ✅ Added ${itemsFromCsv.length} items for ${vendor.store_name}`);
    }

    await client.query('COMMIT');

    console.log('\n✨ Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Categories: ${categoryIds.length}`);
    console.log(`   - Vendors: ${vendors.length}`);
    console.log(`   - Items per vendor: ${itemsFromCsv.length}`);
    console.log(`   - Total items created: ${totalItemsCreated}`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   - View items in admin panel at http://localhost:3000/items`);
    console.log(`   - Test auto-assignment by creating orders`);
    console.log(`   - Configure settings at http://localhost:3000/settings`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCategoriesAndItems().catch(console.error);
