import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { createClient } from 'redis';
import authRoutes from './modules/auth/auth.routes.js';
import vendorRoutes from './modules/vendor/vendor.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import subcategoryRoutes from './modules/subcategory/subcategory.routes.js';
import unitRoutes from './modules/unit/unit.routes.js';
import userRoutes from './modules/user/user.routes.js';
import itemRoutes from './modules/items/item.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import assignmentRoutes from './modules/orders/assignment/assignment.routes.js';
import addressRoutes from './modules/addresses/routes.js';
import adminStatsRoutes from './modules/admin/admin.stats.routes.js';
import adminOrdersRoutes from './modules/admin/admin.orders.routes.js';
import adminVendorsRoutes from './modules/admin/admin.vendors.routes.js';
import adminConfigRoutes from './modules/admin/admin.config.routes.js';
import activityLogRoutes from './modules/activity/activity.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import { handleRazorpayWebhook, captureRawBody } from './modules/orders/razorpay.webhook.js';
import { initializeSocket } from './socket.js';

// Load environment variables FIRST
dotenv.config();

// Debug: Verify DATABASE_URL is loaded before anything else
console.log('🔍 DATABASE_URL in server.js:', process.env.DATABASE_URL ? 'LOADED' : 'MISSING');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// CORS Middleware - MUST be before other middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware - Increase limit for image uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const pg = await import('pg');
    const { Pool } = pg.default;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    res.json({ success: true, message: 'Database connected', time: result.rows[0].now });
  } catch (error) {
    console.error('DB Health Check Error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api', categoryRoutes);
app.use('/api', subcategoryRoutes);
app.use('/api', unitRoutes);
app.use('/api', userRoutes);
app.use('/api', itemRoutes);
app.use('/api', orderRoutes);
app.use('/api', assignmentRoutes);
app.use('/api/addresses', addressRoutes);

// Admin routes
app.use('/api/admin', adminStatsRoutes);
app.use('/api/admin', adminOrdersRoutes);
app.use('/api/admin', adminVendorsRoutes);
app.use('/api/admin', adminConfigRoutes);
app.use('/api/admin/activity-logs', activityLogRoutes);
app.use('/api/admin/reports', reportsRoutes);

// Razorpay webhook (must use raw body for signature verification)
app.post('/api/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  captureRawBody,
  handleRazorpayWebhook
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Initialize Redis and Socket.io
async function startServer() {
  try {
    let redis = null;
    let io = null;
    
    // Try to initialize Redis client (optional for development)
    if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://default:password@host:port') {
      try {
        console.log('📡 Connecting to Redis...');
        redis = createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('❌ Redis max retries reached');
                return new Error('Max retries reached');
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });
        
        redis.on('error', (err) => console.error('Redis Error:', err));
        redis.on('connect', () => console.log('✅ Redis connected'));
        redis.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
        
        await redis.connect();
        
        // Initialize Socket.io with Redis
        console.log('🔌 Initializing Socket.io...');
        io = await initializeSocket(httpServer, redis);
        console.log('✅ Socket.io initialized with Redis');
        
      } catch (redisError) {
        console.warn('⚠️  Redis connection failed:', redisError.message);
        console.warn('⚠️  Running without Redis (order acceptance locking disabled)');
        redis = null;
      }
    } else {
      console.warn('⚠️  REDIS_URL not configured');
      console.warn('⚠️  Running without Redis (order acceptance locking disabled)');
      
      // Initialize Socket.io without Redis
      console.log('🔌 Initializing Socket.io...');
      io = await initializeSocket(httpServer, null);
      console.log('✅ Socket.io initialized without Redis');
    }
    
    // Make io and redis available in routes (can be null)
    app.set('io', io);
    app.set('redis', redis);
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      if (io) {
        console.log(`📡 Socket.io ready on port ${PORT}`);
      }
      if (!redis) {
        console.log(`💡 Tip: Set up Redis for real-time features and atomic locking`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    // Close Redis connection
    const redis = app.get('redis');
    if (redis) {
      await redis.quit();
      console.log('✅ Redis connection closed');
    }
    
    // Close database pool
    const { pool } = await import('./db/index.js');
    if (pool) {
      await pool.end();
      console.log('✅ Database pool closed');
    }
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
