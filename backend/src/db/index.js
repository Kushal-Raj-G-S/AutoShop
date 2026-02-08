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
  // Optimized for Supabase pooler (pgbouncer)
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000, // Reduced: release idle connections quickly
  query_timeout: 30000,
  max: 5, // Lower max for pooler compatibility
  min: 0,  // No minimum - let pooler handle it
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Allow pool to remove broken connections
  allowExitOnIdle: true,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('❌ Database pool error (non-fatal):', err.message);
  // Don't crash the app, pool will recover
});

pool.on('connect', (client) => {
  console.log('✅ Database connection established');
  // Set statement timeout on connection
  client.query('SET statement_timeout = 30000').catch(err => {
    console.error('Failed to set statement timeout:', err.message);
  });
});

export const db = drizzle(pool, { schema });
export { pool }; // Export pool for graceful shutdown

