import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Bangalore area vendors only
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
  },
  {
    shopName: "BTM Layout Supermart",
    ownerName: "Ramesh Babu",
    phoneNumber: "+919845123220",
    email: "btm.super@gmail.com",
    address: "1st Stage, BTM Layout, Bangalore, Karnataka 560068",
    latitude: 12.9166,
    longitude: 77.6101
  },
  {
    shopName: "Marathahalli Daily Store",
    ownerName: "Deepa Shetty",
    phoneNumber: "+919845123221",
    email: "marathahalli.store@gmail.com",
    address: "Outer Ring Road, Marathahalli, Bangalore, Karnataka 560037",
    latitude: 12.9591,
    longitude: 77.7013
  },
  {
    shopName: "JP Nagar Provisions",
    ownerName: "Gopal Krishna",
    phoneNumber: "+919845123222",
    email: "jpnagar.provisions@gmail.com",
    address: "7th Phase, JP Nagar, Bangalore, Karnataka 560078",
    latitude: 12.8996,
    longitude: 77.5852
  },
  {
    shopName: "Bellandur Market",
    ownerName: "Srinivas Murthy",
    phoneNumber: "+919845123223",
    email: "bellandur.market@gmail.com",
    address: "Service Road, Bellandur, Bangalore, Karnataka 560103",
    latitude: 12.9258,
    longitude: 77.6745
  },
  {
    shopName: "RT Nagar Daily Needs",
    ownerName: "Prakash Hegde",
    phoneNumber: "+919845123224",
    email: "rtnagar.daily@gmail.com",
    address: "Main Road, RT Nagar, Bangalore, Karnataka 560032",
    latitude: 13.0215,
    longitude: 77.5960
  }
];

async function seedVendors() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Clearing existing data...\n');

    // Start transaction
    await client.query('BEGIN');

    // Delete in correct order (respecting foreign keys)
    await client.query('DELETE FROM order_items');
    console.log('  ✅ Cleared order_items');
    
    await client.query('DELETE FROM orders');
    console.log('  ✅ Cleared orders');
    
    await client.query('DELETE FROM items');
    console.log('  ✅ Cleared items');
    
    await client.query('DELETE FROM categories');
    console.log('  ✅ Cleared categories');
    
    await client.query('DELETE FROM vendors');
    console.log('  ✅ Cleared vendors');
    
    await client.query("DELETE FROM users WHERE role = 'vendor'");
    console.log('  ✅ Cleared vendor users');

    console.log('\n🌱 Creating Bangalore vendors...\n');

    // Create Vendors
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
      console.log(`  ✅ Created: ${vendor.shopName} (${vendor.address})`);
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✨ Vendor seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total Vendors: ${vendorIds.length}`);
    console.log(`   - Location: Bangalore, Karnataka`);
    console.log(`   - Status: All approved and ready`);
    console.log(`\n📍 Coverage Areas:`);
    console.log(`   - Central: Indiranagar, MG Road, Jayanagar`);
    console.log(`   - North: Malleshwaram, Yelahanka, RT Nagar`);
    console.log(`   - South: HSR Layout, BTM Layout, JP Nagar, Banashankari`);
    console.log(`   - East: Whitefield, Marathahalli, Bellandur`);
    console.log(`   - West: Koramangala, Sarjapur`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   - Add items for each vendor via admin panel`);
    console.log(`   - Test auto-assignment with proximity radius`);
    console.log(`   - Configure system settings for optimal performance`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding vendors:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeder
seedVendors().catch(console.error);
