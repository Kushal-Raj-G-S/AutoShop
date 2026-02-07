import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.js';

// Load environment variables FIRST
dotenv.config();

const { Pool } = pkg;

// Debug: Verify DATABASE_URL is loaded
console.log('🔍 DATABASE_URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');
if (process.env.DATABASE_URL) {
  const urlParts = process.env.DATABASE_URL.split('@');
  console.log('🔍 DB Host:', urlParts[1]?.split('/')[0] || 'unknown');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Increase timeouts for Supabase pooler
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  query_timeout: 30000,
  max: 10, // Reduce max connections for pooler
  min: 2,  // Keep minimum connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

pool.on('connect', () => {
  console.log('✅ Database connection established');
});

export const db = drizzle(pool, { schema });
