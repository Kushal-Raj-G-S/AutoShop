/**
 * Seed default system configuration values
 */
import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config();

const defaultConfigs = [
  // Auto-Assignment Settings
  {
    key: 'assignment_max_radius',
    value: '10',
    description: 'Maximum radius in kilometers to search for nearby vendors',
    category: 'assignment',
    dataType: 'number',
  },
  {
    key: 'assignment_timeout_seconds',
    value: '120',
    description: 'Time in seconds for vendors to accept order before timeout',
    category: 'assignment',
    dataType: 'number',
  },
  {
    key: 'assignment_parallel_push_count',
    value: '3',
    description: 'Number of vendors to push order to simultaneously',
    category: 'assignment',
    dataType: 'number',
  },
  {
    key: 'assignment_auto_reassign',
    value: 'true',
    description: 'Automatically reassign order if all vendors reject or timeout',
    category: 'assignment',
    dataType: 'boolean',
  },
  
  // Pricing Settings
  {
    key: 'pricing_tax_rate',
    value: '5',
    description: 'Tax rate percentage applied to orders',
    category: 'pricing',
    dataType: 'number',
  },
  {
    key: 'pricing_default_delivery_fee',
    value: '0',
    description: 'Default delivery fee in rupees',
    category: 'pricing',
    dataType: 'number',
  },
  {
    key: 'pricing_min_order_value',
    value: '100',
    description: 'Minimum order value required in rupees',
    category: 'pricing',
    dataType: 'number',
  },
  
  // Order Settings
  {
    key: 'order_cancellation_timeout',
    value: '30',
    description: 'Time in minutes after which order cannot be cancelled',
    category: 'order',
    dataType: 'number',
  },
  {
    key: 'order_auto_complete_hours',
    value: '24',
    description: 'Hours after which completed orders are auto-marked as delivered',
    category: 'order',
    dataType: 'number',
  },
];

async function seedConfig() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    for (const config of defaultConfigs) {
      // Check if config already exists
      const checkResult = await client.query(
        'SELECT id FROM system_config WHERE key = $1',
        [config.key]
      );

      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping '${config.key}' - already exists`);
        continue;
      }

      // Insert new config
      await client.query(
        `INSERT INTO system_config (key, value, description, category, data_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [config.key, config.value, config.description, config.category, config.dataType]
      );

      console.log(`✅ Created config: ${config.key} = ${config.value}`);
    }

    console.log('\n🎉 Configuration seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding configuration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedConfig();
