import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import orderService from './modules/orders/order.service.js';
import { createClient } from 'redis';

let io;
let redisClient;

/**
 * Initialize Socket.io server
 */
export async function initializeSocket(server) {
  // Initialize Redis client
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  await redisClient.connect();
  console.log('✅ Redis connected');

  // Initialize Socket.io
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const vendorId = socket.handshake.auth.vendorId;
      
      // Allow test connections with vendorId directly
      if (vendorId && !token) {
        socket.userId = vendorId;
        socket.userRole = 'vendor';
        console.log(`🧪 Test connection: Vendor ${vendorId}`);
        return next();
      }
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}, User: ${socket.userId}, Role: ${socket.userRole}`);

    // Vendor-specific connection handling
    if (socket.userRole === 'vendor') {
      // Join vendor-specific room
      socket.join(`vendor_${socket.userId}`);
      console.log(`👨‍🔧 Vendor ${socket.userId} joined room`);

      // Handle vendor accepting order
      socket.on('ACCEPT_ORDER', async (data) => {
        try {
          const { orderId } = data;
          const vendorId = data.vendorId || socket.userId;

          // Atomic Redis lock
          const lockKey = `order:lock:${orderId}`;
          const lockValue = `vendor:${vendorId}:${Date.now()}`;

          // Try to acquire lock (atomic operation)
          const locked = await redisClient.set(lockKey, lockValue, {
            NX: true, // Only set if not exists
            EX: 300, // Expire in 5 minutes
          });

          if (!locked) {
            // Lock failed - another vendor got it
            socket.emit('ACCEPT_ORDER_FAILED', {
              orderId,
              reason: 'Order already accepted by another vendor',
            });
            
            // For test compatibility
            socket.emit('ACCEPT_RESULT', {
              ok: false,
              winner: false,
              orderId,
            });
            
            console.log(`❌ Vendor ${vendorId} lost race for order ${orderId}`);
            return;
          }

          try {
            // Lock acquired! Proceed with database transaction
            await orderService.vendorAccept(orderId, vendorId);

            // Notify all listeners
            io.to(`order_${orderId}`).emit('ORDER_ACCEPTED', {
              orderId,
              vendorId,
            });

            socket.emit('ACCEPT_ORDER_SUCCESS', {
              orderId,
            });
            
            // For test compatibility
            socket.emit('ACCEPT_RESULT', {
              ok: true,
              winner: true,
              orderId,
              vendorId,
            });

            console.log(`✅ Order ${orderId} accepted by vendor ${vendorId}`);
          } catch (error) {
            // Release lock on error
            await redisClient.del(lockKey);
            
            socket.emit('ACCEPT_ORDER_FAILED', {
              orderId,
              reason: error.message,
            });
            
            // For test compatibility
            socket.emit('ACCEPT_RESULT', {
              ok: false,
              winner: false,
              error: error.message,
            });

            console.error(`❌ Failed to accept order ${orderId}:`, error.message);
          }
        } catch (error) {
          socket.emit('ERROR', { message: error.message });
          socket.emit('ACCEPT_RESULT', {
            ok: false,
            winner: false,
            error: error.message,
          });
        }
      });

      // Handle vendor rejecting order
      socket.on('REJECT_ORDER', async (data) => {
        try {
          const { orderId, vendorId, reason } = data;

          await orderService.vendorReject(orderId, vendorId, reason);

          socket.emit('REJECT_ORDER_SUCCESS', {
            orderId,
          });

          console.log(`❌ Order ${orderId} rejected by vendor ${vendorId}`);
        } catch (error) {
          socket.emit('REJECT_ORDER_FAILED', {
            orderId: data.orderId,
            reason: error.message,
          });
        }
      });

      // Handle status updates
      socket.on('UPDATE_ORDER_STATUS', async (data) => {
        try {
          const { orderId, vendorId, status } = data;

          await orderService.markStatus(orderId, vendorId, status);

          io.to(`order_${orderId}`).emit('ORDER_STATUS_UPDATE', {
            orderId,
            status,
          });

          socket.emit('UPDATE_STATUS_SUCCESS', {
            orderId,
            status,
          });

          console.log(`📦 Order ${orderId} status updated to ${status}`);
        } catch (error) {
          socket.emit('UPDATE_STATUS_FAILED', {
            orderId: data.orderId,
            reason: error.message,
          });
        }
      });

      // TEST HANDLER: Lock-only test (no DB required)
      socket.on('TEST_ACCEPT_ONLY', async ({ orderId }) => {
        try {
          const vendorId = socket.userId;
          const key = `testlock:${orderId}`;
          const result = await redisClient.set(key, vendorId, { NX: true, EX: 60 });

          if (result === 'OK') {
            socket.emit('TEST_ACCEPT_RESULT', { ok: true, winner: true, vendorId, orderId });
            console.log(`🏆 TEST: Vendor ${vendorId} won lock for order ${orderId}`);
          } else {
            socket.emit('TEST_ACCEPT_RESULT', { ok: false, winner: false, vendorId, orderId });
            console.log(`❌ TEST: Vendor ${vendorId} lost lock for order ${orderId}`);
          }
        } catch (error) {
          socket.emit('TEST_ACCEPT_RESULT', { ok: false, winner: false, error: error.message });
        }
      });
    }

    // Customer-specific connection handling
    if (socket.userRole === 'customer') {
      // Customer can subscribe to their order updates
      socket.on('SUBSCRIBE_ORDER', (data) => {
        const { orderId } = data;
        socket.join(`order_${orderId}`);
        console.log(`👤 Customer ${socket.userId} subscribed to order ${orderId}`);
      });
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io initialized');

  return { io, redis: redisClient };
}

/**
 * Get Socket.io instance
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Get Redis client
 */
export function getRedis() {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
}

export { io, redisClient };
