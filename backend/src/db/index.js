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
  // Add connection timeout and better error handling
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

export const db = drizzle(pool, { schema });
