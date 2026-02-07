import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Realistic Indian vendor data - Bangalore focused
const vendorData = [
  {
    shopName: "Anand Provisions Store",
    ownerName: "Anand Kumar",
    phoneNumber: "+919845123210",
    email: "anand.provisions@gmail.com",
    address: "Shop No 12, MG Road, Indiranagar, Bangalore, Karnataka 560038",
    latitude: 12.9716,
    longitude: 77.5946
  },
  {
    shopName: "Koramangala Daily Needs",
    ownerName: "Rajesh Sharma",
    phoneNumber: "+919845123211",
    email: "koramangala.daily@gmail.com",
    address: "45, 6th Block, Koramangala, Bangalore, Karnataka 560095",
    latitude: 12.9352,
    longitude: 77.6245
  },
  {
    shopName: "Whitefield Supermart",
    ownerName: "Suresh Patel",
    phoneNumber: "+919845123212",
    email: "whitefield.super@gmail.com",
    address: "Plot 23, ITPL Main Road, Whitefield, Bangalore, Karnataka 560066",
    latitude: 12.9698,
    longitude: 77.7499
  },
  {
    shopName: "Jayanagar Kirana Store",
    ownerName: "Venkatesh Iyer",
    phoneNumber: "+919845123213",
    email: "jayanagar.kirana@gmail.com",
    address: "No 78, 4th Block, Jayanagar, Bangalore, Karnataka 560011",
    latitude: 12.9250,
    longitude: 77.5838
  },
  {
    shopName: "HSR Layout General Store",
    ownerName: "Mohammed Rafi",
    phoneNumber: "+919845123214",
    email: "hsr.general@gmail.com",
    address: "Building 5, Sector 2, HSR Layout, Bangalore, Karnataka 560102",
    latitude: 12.9121,
    longitude: 77.6446
  },
  {
    shopName: "Malleshwaram Provisions",
    ownerName: "Amit Rao",
    phoneNumber: "+919845123215",
    email: "malleshwaram.provisions@gmail.com",
    address: "Street 14, 8th Cross, Malleshwaram, Bangalore, Karnataka 560003",
    latitude: 13.0059,
    longitude: 77.5726
  },
  {
    shopName: "Sarjapur Mart",
    ownerName: "Priya Deshmukh",
    phoneNumber: "+919845123216",
    email: "sarjapur.mart@gmail.com",
    address: "Lane 7, Sarjapur Road, Bangalore, Karnataka 560035",
    latitude: 12.9010,
    longitude: 77.6869
  },
  {
    shopName: "Yelahanka Bazaar",
    ownerName: "Vikram Singh",
    phoneNumber: "+919845123217",
    email: "yelahanka.bazaar@gmail.com",
    address: "C-15, Old Town, Yelahanka, Bangalore, Karnataka 560064",
    latitude: 13.1007,
    longitude: 77.5963
  },
  {
    shopName: "Electronic City Superstore",
    ownerName: "Lakshmi Narayanan",
    phoneNumber: "+919845123218",
    email: "ecity.super@gmail.com",
    address: "Phase 1, Electronic City, Bangalore, Karnataka 560100",
    latitude: 12.8456,
    longitude: 77.6603
  },
  {
    shopName: "Banashankari Daily Fresh",
    ownerName: "Karthik Reddy",
    phoneNumber: "+919845123219",
    email: "banashankari.fresh@gmail.com",
    address: "2nd Stage, Banashankari, Bangalore, Karnataka 560070",
    latitude: 12.9250,
    longitude: 77.5482
  }
];

// Realistic categories with Indian context
const categoryData = [
  {
    name: "Groceries & Staples",
    description: "Daily essentials including rice, wheat, pulses, and cooking oil",
    imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9"
  },
  {
    name: "Fruits & Vegetables",
    description: "Fresh fruits and vegetables sourced daily",
    imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c"
  },
  {
    name: "Dairy & Eggs",
    description: "Milk, curd, paneer, butter, and fresh eggs",
    imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da"
  },
  {
    name: "Snacks & Beverages",
    description: "Chips, biscuits, namkeen, soft drinks, and juices",
    imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087"
  },
  {
    name: "Personal Care",
    description: "Soaps, shampoos, toothpaste, and hygiene products",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03"
  },
  {
    name: "Household Items",
    description: "Cleaning supplies, detergents, and home essentials",
    imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17"
  }
];

// Realistic items with Indian pricing
const itemsData = [
  // Groceries & Staples
  { name: "Basmati Rice (5kg)", categoryId: 1, price: 450, unit: "bag", description: "Premium quality aged basmati rice", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c" },
  { name: "Whole Wheat Atta (10kg)", categoryId: 1, price: 380, unit: "bag", description: "Chakki fresh whole wheat flour", imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b" },
  { name: "Toor Dal (1kg)", categoryId: 1, price: 140, unit: "kg", description: "Premium arhar dal", imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b" },
  { name: "Moong Dal (1kg)", categoryId: 1, price: 120, unit: "kg", description: "Split green gram", imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b" },
  { name: "Refined Sunflower Oil (1L)", categoryId: 1, price: 180, unit: "liter", description: "Pure sunflower cooking oil", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5" },
  { name: "Mustard Oil (1L)", categoryId: 1, price: 220, unit: "liter", description: "Pure kachi ghani mustard oil", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5" },
  { name: "Sugar (1kg)", categoryId: 1, price: 45, unit: "kg", description: "White refined sugar", imageUrl: "https://images.unsplash.com/photo-1609096458733-95b38583ac4e" },
  { name: "Iodized Salt (1kg)", categoryId: 1, price: 22, unit: "kg", description: "Tata salt", imageUrl: "https://images.unsplash.com/photo-1599909533730-f38f89ed8655" },
  
  // Fruits & Vegetables
  { name: "Tomatoes", categoryId: 2, price: 35, unit: "kg", description: "Fresh red tomatoes", imageUrl: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337" },
  { name: "Onions", categoryId: 2, price: 40, unit: "kg", description: "Medium size onions", imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb" },
  { name: "Potatoes", categoryId: 2, price: 28, unit: "kg", description: "Fresh potatoes", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655" },
  { name: "Green Chillies", categoryId: 2, price: 60, unit: "kg", description: "Hot green chillies", imageUrl: "https://images.unsplash.com/photo-1604908815749-7dcd87fa7cc6" },
  { name: "Apples (Shimla)", categoryId: 2, price: 180, unit: "kg", description: "Fresh Shimla apples", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6" },
  { name: "Bananas", categoryId: 2, price: 50, unit: "dozen", description: "Ripe bananas", imageUrl: "https://images.unsplash.com/photo-1603833665858-e61d17a86224" },
  { name: "Mangoes (Alphonso)", categoryId: 2, price: 350, unit: "kg", description: "Premium Alphonso mangoes", imageUrl: "https://images.unsplash.com/photo-1605027990121-cbae9d3ce9cd" },
  
  // Dairy & Eggs
  { name: "Full Cream Milk (1L)", categoryId: 3, price: 65, unit: "liter", description: "Fresh cow milk", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150" },
  { name: "Curd/Dahi (500g)", categoryId: 3, price: 35, unit: "pack", description: "Fresh curd", imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51" },
  { name: "Paneer (200g)", categoryId: 3, price: 90, unit: "pack", description: "Fresh cottage cheese", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7" },
  { name: "Amul Butter (100g)", categoryId: 3, price: 55, unit: "pack", description: "Salted butter", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d" },
  { name: "Eggs (30 pcs)", categoryId: 3, price: 180, unit: "tray", description: "Farm fresh eggs", imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f" },
  
  // Snacks & Beverages
  { name: "Lay's Chips (50g)", categoryId: 4, price: 20, unit: "pack", description: "Classic salted chips", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b" },
  { name: "Parle-G Biscuits (200g)", categoryId: 4, price: 25, unit: "pack", description: "Glucose biscuits", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35" },
  { name: "Haldiram Namkeen (200g)", categoryId: 4, price: 60, unit: "pack", description: "Aloo bhujia", imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087" },
  { name: "Coca Cola (2L)", categoryId: 4, price: 90, unit: "bottle", description: "Soft drink", imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7" },
  { name: "Real Fruit Juice (1L)", categoryId: 4, price: 125, unit: "pack", description: "Mixed fruit juice", imageUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba" },
  
  // Personal Care
  { name: "Lux Soap (125g)", categoryId: 5, price: 35, unit: "piece", description: "Beauty soap", imageUrl: "https://images.unsplash.com/photo-1585128903994-c3e7a6d1e8f7" },
  { name: "Dove Shampoo (180ml)", categoryId: 5, price: 180, unit: "bottle", description: "Hair shampoo", imageUrl: "https://images.unsplash.com/photo-1631730486572-226d1f595b68" },
  { name: "Colgate Toothpaste (200g)", categoryId: 5, price: 110, unit: "tube", description: "Dental protection", imageUrl: "https://images.unsplash.com/photo-1622372738946-62e02505feb3" },
  { name: "Dettol Handwash (200ml)", categoryId: 5, price: 75, unit: "bottle", description: "Antibacterial handwash", imageUrl: "https://images.unsplash.com/photo-1584900142958-d4fa36c355ab" },
  
  // Household Items
  { name: "Vim Bar (200g)", categoryId: 6, price: 20, unit: "piece", description: "Dishwash bar", imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473" },
  { name: "Surf Excel (1kg)", categoryId: 6, price: 180, unit: "pack", description: "Detergent powder", imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce" },
  { name: "Harpic Toilet Cleaner (500ml)", categoryId: 6, price: 95, unit: "bottle", description: "Toilet cleaner", imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17" },
  { name: "Lizol Floor Cleaner (975ml)", categoryId: 6, price: 180, unit: "bottle", description: "Disinfectant floor cleaner", imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17" }
];

async function seedData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting realistic data seeding...\n');

    // Check if data already exists
    const checkResult = await client.query('SELECT COUNT(*) FROM vendors');
    const vendorCount = parseInt(checkResult.rows[0].count);
    
    if (vendorCount > 0) {
      console.log(`⚠️  Found ${vendorCount} existing vendors.`);
      console.log('Do you want to clear existing data? (This will delete all vendors, items, categories, and orders)');
      console.log('Run with --force flag to clear and reseed, or use different phone numbers.');
      console.log('\nSkipping seed to avoid duplicates.\n');
      return;
    }

    // Start transaction
    await client.query('BEGIN');

    // 1. Create Vendors
    console.log('👨‍💼 Creating vendors...');
    const vendorIds = [];
    
    for (const vendor of vendorData) {
      // First create user
      const userResult = await client.query(
        `INSERT INTO users (phone_number, role, name, email)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [vendor.phoneNumber, 'vendor', vendor.ownerName, vendor.email]
      );
      const userId = userResult.rows[0].id;
      
      // Then create vendor profile
      const vendorResult = await client.query(
        `INSERT INTO vendors (
          user_id, store_name, owner_name, phone, document_url,
          store_address, latitude, longitude, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          userId,
          vendor.shopName,
          vendor.ownerName,
          vendor.phoneNumber,
          'https://via.placeholder.com/400x300?text=Shop+Document',
          vendor.address,
          vendor.latitude,
          vendor.longitude,
          'approved'
        ]
      );
      vendorIds.push(vendorResult.rows[0].id);
      console.log(`  ✅ Created vendor: ${vendor.shopName}`);
    }

    // 2. Create Categories
    console.log('\n📂 Creating categories...');
    const categoryIds = [];
    
    for (const category of categoryData) {
      const result = await client.query(
        `INSERT INTO categories (name, description, image_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [category.name, category.description, category.imageUrl]
      );
      categoryIds.push(result.rows[0].id);
      console.log(`  ✅ Created category: ${category.name}`);
    }

    // 3. Create Items (distributed across vendors)
    console.log('\n📦 Creating items...');
    let itemCount = 0;
    
    for (const item of itemsData) {
      // Randomly assign 2-4 vendors to each item
      const numVendors = Math.floor(Math.random() * 3) + 2; // 2 to 4 vendors
      const shuffledVendors = [...vendorIds].sort(() => Math.random() - 0.5);
      const selectedVendors = shuffledVendors.slice(0, numVendors);
      
      for (const vendorId of selectedVendors) {
        // Add slight price variation across vendors (±10%)
        const priceVariation = 1 + (Math.random() * 0.2 - 0.1);
        const vendorPrice = Math.round(item.price * priceVariation);
        
        // Random stock between 10-100
        const stock = Math.floor(Math.random() * 90) + 10;
        
        await client.query(
          `INSERT INTO items (
            vendor_id, category_id, name, description, price, 
            unit, stock_quantity, image_url, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            vendorId,
            categoryIds[item.categoryId - 1],
            item.name,
            item.description,
            vendorPrice,
            item.unit,
            stock,
            item.imageUrl,
            'approved'
          ]
        );
        itemCount++;
      }
      console.log(`  ✅ Created item: ${item.name} (${numVendors} vendors)`);
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✨ Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Vendors: ${vendorIds.length}`);
    console.log(`   - Categories: ${categoryIds.length}`);
    console.log(`   - Items: ${itemCount}`);
    console.log(`\n🎯 You can now test:`);
    console.log(`   - Auto-assignment with proximity radius`);
    console.log(`   - Order placement with real items`);
    console.log(`   - Pricing with tax and delivery fees`);
    console.log(`   - Vendor management`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeder
seedData().catch(console.error);
