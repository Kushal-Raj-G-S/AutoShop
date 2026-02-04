/**
 * ORDER ASSIGNMENT ENGINE - SERVICE LAYER
 * 
 * Handles vendor assignment logic:
 * - Proximity-based vendor selection
 * - Atomic order acceptance via Redis locks
 * - Fallback when vendors reject/timeout
 * - Assignment lifecycle tracking
 */

import { db } from '../../../db/index.js';
import { orders, orderAssignments } from '../schema.js';
import { vendors } from '../../../db/schema.js';
import { eq, and, sql, inArray } from 'drizzle-orm';

class AssignmentService {
  constructor(redisClient, socketManager) {
    this.redis = redisClient;
    this.io = socketManager;
  }

  /**
   * Start order assignment process
   * Finds nearby vendors and pushes order to them
   * 
   * @param {number} orderId - Order ID
   * @param {Object} options - Assignment options
   * @returns {Promise<Object>} Assignment result
   */
  async startAssignment(orderId, options = {}) {
    const {
      maxRadius = process.env.ORDER_ASSIGNMENT_MAX_RADIUS_KM || 10,
      parallelPushCount = process.env.ORDER_ASSIGNMENT_BATCH_SIZE || 3,
      timeoutSeconds = process.env.ORDER_ASSIGNMENT_TIMEOUT || 120,
    } = options;

    console.log(`📋 Starting assignment for order ${orderId}`);

    // 1. Fetch order details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('NOT_FOUND: Order not found');
    }

    // Validate order status
    const validStatuses = ['awaiting_assignment', 'payment_verified', 'paid'];
    if (!validStatuses.includes(order.status)) {
      throw new Error(`INVALID_STATE: Order status must be one of ${validStatuses.join(', ')}`);
    }

    // 2. Find nearby vendors using Haversine formula
    const nearbyVendors = await this.findNearbyVendors(
      order.deliveryLatitude,
      order.deliveryLongitude,
      maxRadius
    );

    if (nearbyVendors.length === 0) {
      throw new Error('NO_VENDORS: No vendors available within radius');
    }

    console.log(`📍 Found ${nearbyVendors.length} vendors within ${maxRadius}km`);

    // 3. Select first batch of vendors
    const selectedVendors = nearbyVendors.slice(0, parallelPushCount);
    const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

    // 4. Create assignment records
    const assignmentRecords = selectedVendors.map(vendor => ({
      orderId,
      vendorId: vendor.id,
      status: 'PUSHED',
      pushedAt: new Date(),
      respondedAt: null,
      expiresAt,
      meta: {
        distance: vendor.distance,
        batchNumber: 1,
      },
    }));

    await db.insert(orderAssignments).values(assignmentRecords);

    console.log(`✅ Created ${assignmentRecords.length} assignment records`);

    // 5. Emit socket events to vendors
    if (this.io && typeof this.io.to === 'function') {
      try {
        const orderPayload = {
          orderId: order.id,
          orderNumber: order.orderId,
          totalAmount: parseFloat(order.total),
          deliveryAddress: order.deliveryAddress,
          deliveryLatitude: order.deliveryLatitude,
          deliveryLongitude: order.deliveryLongitude,
          ttl: timeoutSeconds,
          expiresAt: expiresAt.toISOString(),
        };

        selectedVendors.forEach(vendor => {
          this.io.to(`vendor_${vendor.user_id}`).emit('NEW_ORDER', {
            ...orderPayload,
            distance: vendor.distance,
          });
          console.log(`📤 Pushed order ${orderId} to vendor ${vendor.id} (user ${vendor.user_id})`);
        });
      } catch (socketError) {
        console.error('⚠️  Socket.io emit failed:', socketError.message);
        // Continue anyway - assignment records are created
      }
    } else {
      console.warn('⚠️  Socket.io not available - vendors not notified in real-time');
    }

    return {
      orderId,
      vendorsNotified: selectedVendors.length,
      expiresAt,
      vendors: selectedVendors.map(v => ({ id: v.id, distance: v.distance })),
    };
  }

  /**
   * Find nearby vendors using Haversine distance formula
   * 
   * @param {number} latitude - Delivery latitude
   * @param {number} longitude - Delivery longitude
   * @param {number} maxRadius - Maximum radius in kilometers
   * @returns {Promise<Array>} List of nearby vendors with distance
   */
  async findNearbyVendors(latitude, longitude, maxRadius) {
    // Haversine formula in SQL (distance in kilometers)
    const distanceFormula = sql`(
      6371 * acos(
        cos(radians(${latitude})) 
        * cos(radians(${vendors.latitude})) 
        * cos(radians(${vendors.longitude}) - radians(${longitude})) 
        + sin(radians(${latitude})) 
        * sin(radians(${vendors.latitude}))
      )
    )`;

    const nearbyVendors = await db
      .select({
        id: vendors.id,
        user_id: vendors.userId,
        storeName: vendors.storeName,
        latitude: vendors.latitude,
        longitude: vendors.longitude,
        distance: distanceFormula,
      })
      .from(vendors)
      .where(
        and(
          eq(vendors.status, 'approved'),
          sql`${distanceFormula} <= ${maxRadius}`
        )
      )
      .orderBy(distanceFormula);

    return nearbyVendors;
  }

  /**
   * Handle vendor accepting an order (ATOMIC with Redis lock)
   * 
   * @param {number} orderId - Order ID
   * @param {number} vendorId - Vendor ID
   * @returns {Promise<Object>} Acceptance result
   */
  async vendorAccept(orderId, vendorId) {
    console.log(`🔒 Vendor ${vendorId} attempting to accept order ${orderId}`);

    // 1. Check if assignment exists
    const [assignment] = await db
      .select()
      .from(orderAssignments)
      .where(
        and(
          eq(orderAssignments.orderId, orderId),
          eq(orderAssignments.vendorId, vendorId),
          eq(orderAssignments.status, 'PUSHED')
        )
      )
      .limit(1);

    if (!assignment) {
      throw new Error('NOT_FOUND: No active assignment found for this vendor');
    }

    // Check if expired
    if (new Date() > new Date(assignment.expiresAt)) {
      await db
        .update(orderAssignments)
        .set({ status: 'EXPIRED', respondedAt: new Date() })
        .where(eq(orderAssignments.id, assignment.id));
      
      throw new Error('EXPIRED: Assignment has expired');
    }

    // 2. Try to acquire Redis lock (ATOMIC)
    const lockKey = `order:lock:${orderId}`;
    const lockValue = `vendor:${vendorId}:${Date.now()}`;

    if (!this.redis) {
      throw new Error('REDIS_UNAVAILABLE: Redis not configured');
    }

    const locked = await this.redis.set(lockKey, lockValue, {
      NX: true,  // Only set if key doesn't exist
      EX: 300,   // Expire in 5 minutes
    });

    if (!locked) {
      // Another vendor got the lock first
      await db
        .update(orderAssignments)
        .set({ status: 'REJECTED', respondedAt: new Date() })
        .where(eq(orderAssignments.id, assignment.id));

      console.log(`❌ Vendor ${vendorId} lost race for order ${orderId}`);
      
      return {
        success: false,
        winner: false,
        reason: 'ORDER_ALREADY_ACCEPTED',
      };
    }

    // 3. Lock acquired! Proceed with DB transaction
    try {
      await db.transaction(async (tx) => {
        // Update order
        await tx
          .update(orders)
          .set({
            assignedVendorId: vendorId,
            status: 'vendor_accepted',
            acceptedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Update this assignment to ACCEPTED
        await tx
          .update(orderAssignments)
          .set({
            status: 'ACCEPTED',
            respondedAt: new Date(),
          })
          .where(eq(orderAssignments.id, assignment.id));

        // Update other assignments to REJECTED
        await tx
          .update(orderAssignments)
          .set({
            status: 'REJECTED',
            respondedAt: new Date(),
          })
          .where(
            and(
              eq(orderAssignments.orderId, orderId),
              eq(orderAssignments.status, 'PUSHED')
            )
          );
      });

      console.log(`✅ Vendor ${vendorId} successfully accepted order ${orderId}`);

      // Emit events
      if (this.io) {
        // Notify customer
        this.io.to(`order_${orderId}`).emit('ORDER_ASSIGNED', {
          orderId,
          vendorId,
          status: 'vendor_accepted',
        });

        // Notify vendor
        this.io.to(`vendor_${vendorId}`).emit('ACCEPT_RESULT', {
          ok: true,
          winner: true,
          orderId,
        });

        // Cancel push to other vendors
        this.io.to(`order_${orderId}`).emit('CANCEL_PUSH', {
          orderId,
          reason: 'Order accepted by another vendor',
        });
      }

      return {
        success: true,
        winner: true,
        orderId,
        vendorId,
      };

    } catch (error) {
      // Release lock on error
      await this.redis.del(lockKey);
      throw error;
    }
  }

  /**
   * Handle vendor rejecting an order
   * 
   * @param {number} orderId - Order ID
   * @param {number} vendorId - Vendor ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejection result
   */
  async vendorReject(orderId, vendorId, reason = 'Vendor declined') {
    console.log(`❌ Vendor ${vendorId} rejecting order ${orderId}: ${reason}`);

    // Update assignment status
    const result = await db
      .update(orderAssignments)
      .set({
        status: 'REJECTED',
        respondedAt: new Date(),
        meta: sql`jsonb_set(COALESCE(meta, '{}'::jsonb), '{rejectionReason}', ${JSON.stringify(reason)}::jsonb)`,
      })
      .where(
        and(
          eq(orderAssignments.orderId, orderId),
          eq(orderAssignments.vendorId, vendorId),
          eq(orderAssignments.status, 'PUSHED')
        )
      );

    // Check if all vendors have rejected
    const remainingAssignments = await db
      .select()
      .from(orderAssignments)
      .where(
        and(
          eq(orderAssignments.orderId, orderId),
          eq(orderAssignments.status, 'PUSHED')
        )
      );

    if (remainingAssignments.length === 0) {
      console.log(`⚠️  All vendors rejected order ${orderId}, starting fallback...`);
      // Start fallback assignment (next batch)
      await this.startFallbackAssignment(orderId);
    }

    return {
      success: true,
      orderId,
      remainingVendors: remainingAssignments.length,
    };
  }

  /**
   * Start fallback assignment when all vendors reject/timeout
   * 
   * @param {number} orderId - Order ID
   */
  async startFallbackAssignment(orderId) {
    console.log(`🔄 Starting fallback assignment for order ${orderId}`);

    // Get already tried vendors
    const triedAssignments = await db
      .select({ vendorId: orderAssignments.vendorId })
      .from(orderAssignments)
      .where(eq(orderAssignments.orderId, orderId));

    const triedVendorIds = triedAssignments.map(a => a.vendorId);

    // Get order details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('NOT_FOUND: Order not found');
    }

    // Find next batch of vendors (excluding already tried)
    const maxRadius = process.env.ORDER_ASSIGNMENT_MAX_RADIUS_KM || 10;
    const allVendors = await this.findNearbyVendors(
      order.deliveryLatitude,
      order.deliveryLongitude,
      maxRadius
    );

    const nextBatchVendors = allVendors.filter(v => !triedVendorIds.includes(v.id));

    if (nextBatchVendors.length === 0) {
      // No more vendors available
      await db
        .update(orders)
        .set({
          status: 'assignment_failed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`❌ No more vendors available for order ${orderId}`);
      
      if (this.io) {
        this.io.to(`order_${orderId}`).emit('ASSIGNMENT_FAILED', {
          orderId,
          reason: 'No vendors available',
        });
      }

      return;
    }

    // Start assignment with next batch
    await this.startAssignment(orderId, {
      parallelPushCount: Math.min(3, nextBatchVendors.length),
    });
  }

  /**
   * Admin force-assign order to specific vendor
   * 
   * @param {number} orderId - Order ID
   * @param {number} vendorId - Vendor ID
   * @returns {Promise<Object>} Assignment result
   */
  async forceAssign(orderId, vendorId) {
    console.log(`🔧 Admin force-assigning order ${orderId} to vendor ${vendorId}`);

    // Verify vendor exists and is approved
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.id, vendorId),
          eq(vendors.status, 'approved')
        )
      )
      .limit(1);

    if (!vendor) {
      throw new Error('NOT_FOUND: Vendor not found or not approved');
    }

    // Verify order exists
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('NOT_FOUND: Order not found');
    }

    // Perform assignment in transaction
    await db.transaction(async (tx) => {
      // Update order
      await tx
        .update(orders)
        .set({
          assignedVendorId: vendorId,
          status: 'vendor_accepted',
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Cancel all existing assignments
      await tx
        .update(orderAssignments)
        .set({
          status: 'REJECTED',
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.status, 'PUSHED')
          )
        );

      // Create new ACCEPTED assignment
      await tx.insert(orderAssignments).values({
        orderId,
        vendorId,
        status: 'ACCEPTED',
        pushedAt: new Date(),
        respondedAt: new Date(),
        meta: { forceAssigned: true, assignedBy: 'admin' },
      });
    });

    // Emit events
    if (this.io && typeof this.io.to === 'function') {
      this.io.to(`order_${orderId}`).emit('ORDER_ASSIGNED', {
        orderId,
        vendorId,
        status: 'vendor_accepted',
        forceAssigned: true,
      });

      this.io.to(`vendor_${vendorId}`).emit('ORDER_FORCE_ASSIGNED', {
        orderId,
      });
    }

    console.log(`✅ Order ${orderId} force-assigned to vendor ${vendorId}`);

    return {
      success: true,
      orderId,
      vendorId,
      forceAssigned: true,
    };
  }

  /**
   * Get assignment history for an order
   * 
   * @param {number} orderId - Order ID
   * @returns {Promise<Array>} Assignment history
   */
  async getAssignmentHistory(orderId) {
    const assignments = await db
      .select({
        id: orderAssignments.id,
        vendorId: orderAssignments.vendorId,
        status: orderAssignments.status,
        pushedAt: orderAssignments.pushedAt,
        respondedAt: orderAssignments.respondedAt,
        expiresAt: orderAssignments.expiresAt,
        meta: orderAssignments.meta,
        storeName: vendors.storeName,
      })
      .from(orderAssignments)
      .leftJoin(vendors, eq(orderAssignments.vendorId, vendors.id))
      .where(eq(orderAssignments.orderId, orderId))
      .orderBy(orderAssignments.pushedAt);

    return assignments;
  }
}

export default AssignmentService;
