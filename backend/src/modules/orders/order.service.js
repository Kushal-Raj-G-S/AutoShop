import { db } from '../../db/index.js';
import { orders, orderItems, orderAssignments, payments, orderLogs } from './schema.js';
import { items, users, vendors } from '../../db/schema.js';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class OrderService {
  /**
   * Generate unique order ID
   */
  generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Log order action
   */
  async logAction(orderId, action, actor, actorId, metadata = null, message = null) {
    try {
      await db.insert(orderLogs).values({
        orderId,
        action,
        actor,
        actorId: actorId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        message,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to log order action:', error);
      // Don't throw - logging should not break the flow
    }
  }

  /**
   * Get vendor by user ID
   */
  async getVendorByUserId(userId) {
    try {
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.userId, userId))
        .limit(1);
      
      return vendor && vendor.length > 0 ? vendor[0] : null;
    } catch (error) {
      console.error('Failed to get vendor by userId:', error);
      return null;
    }
  }

  /**
   * Calculate delivery fee based on distance
   */
  calculateDeliveryFee(distanceKm) {
    if (distanceKm <= 5) return 0;
    if (distanceKm <= 10) return 20;
    if (distanceKm <= 20) return 40;
    return 60;
  }

  /**
   * Create a new order
   * @param {string} userId - User ID
   * @param {Array} cart - Array of { itemId, quantity }
   * @param {Object} address - { address, latitude, longitude, phone }
   * @param {string} paymentMethod - 'razorpay', 'cod', 'wallet'
   */
  async createOrder(userId, cart, address, paymentMethod) {
    if (!cart || cart.length === 0) {
      throw new Error('VALIDATION: Cart cannot be empty');
    }

    if (!address || !address.address || !address.latitude || !address.longitude || !address.phone) {
      throw new Error('VALIDATION: Complete delivery address is required');
    }

    if (!['razorpay', 'cod', 'wallet'].includes(paymentMethod)) {
      throw new Error('VALIDATION: Invalid payment method');
    }

    // Use transaction for atomic order creation
    const result = await db.transaction(async (tx) => {
      // Fetch items and validate stock
      const itemIds = cart.map(c => c.itemId);
      const fetchedItems = await tx
        .select()
        .from(items)
        .where(inArray(items.id, itemIds));

      if (fetchedItems.length !== itemIds.length) {
        throw new Error('VALIDATION: Some items not found');
      }

      // Create item map
      const itemMap = {};
      fetchedItems.forEach(item => {
        itemMap[item.id] = item;
      });

      // Validate stock and calculate totals
      let subtotal = 0;
      const orderItemsData = [];

      for (const cartItem of cart) {
        const item = itemMap[cartItem.itemId];
        
        if (!item) {
          throw new Error(`VALIDATION: Item ${cartItem.itemId} not found`);
        }

        if (item.isActive !== 'true') {
          throw new Error(`VALIDATION: Item ${item.name} is not available`);
        }

        if (item.stock < cartItem.quantity) {
          throw new Error(`VALIDATION: Insufficient stock for ${item.name}. Available: ${item.stock}`);
        }

        const itemSubtotal = parseFloat(item.price) * cartItem.quantity;
        subtotal += itemSubtotal;

        orderItemsData.push({
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          itemImageUrl: item.imageUrl,
          quantity: cartItem.quantity,
          subtotal: itemSubtotal.toFixed(2),
        });
      }

      // Calculate fees
      const tax = (subtotal * 0.05).toFixed(2); // 5% tax
      const deliveryFee = this.calculateDeliveryFee(5); // Default 5km for now
      const total = (subtotal + parseFloat(tax) + deliveryFee).toFixed(2);

      // Generate order ID
      const orderId = this.generateOrderId();

      // Determine initial status based on payment method
      const initialStatus = paymentMethod === 'cod' ? 'awaiting_assignment' : 'pending_payment';

      // Create order
      const [order] = await tx.insert(orders).values({
        orderId,
        userId,
        deliveryAddress: address.address,
        deliveryLatitude: address.latitude,
        deliveryLongitude: address.longitude,
        deliveryPhone: address.phone,
        subtotal: subtotal.toFixed(2),
        tax,
        deliveryFee: deliveryFee.toFixed(2),
        total,
        status: initialStatus,
        paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Create order items
      const createdItems = await tx.insert(orderItems).values(
        orderItemsData.map(item => ({
          orderId: order.id,
          ...item,
          createdAt: new Date(),
        }))
      ).returning();

      // Update item stock
      for (const cartItem of cart) {
        await tx.update(items)
          .set({
            stock: sql`${items.stock} - ${cartItem.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(items.id, cartItem.itemId));
      }

      // Create payment record
      let paymentRecord = null;
      let razorpayOrder = null;

      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        try {
          razorpayOrder = await razorpay.orders.create({
            amount: Math.round(parseFloat(total) * 100), // Convert to paise
            currency: 'INR',
            receipt: order.orderId,
            notes: {
              orderId: order.id.toString(),
              userId: userId,
            },
          });

          const [payment] = await tx.insert(payments).values({
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            amount: total,
            currency: 'INR',
            status: 'initiated',
            paymentMethod: 'razorpay',
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();

          paymentRecord = payment;
        } catch (error) {
          console.error('Razorpay order creation failed:', error);
          throw new Error('PAYMENT: Failed to initiate payment gateway');
        }
      } else if (paymentMethod === 'cod') {
        const [payment] = await tx.insert(payments).values({
          orderId: order.id,
          amount: total,
          currency: 'INR',
          status: 'pending',
          paymentMethod: 'cod',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        paymentRecord = payment;
      }

      return {
        order,
        orderItems: createdItems,
        payment: paymentRecord,
        razorpayOrder,
      };
    });

    // Log order creation (outside transaction to avoid FK issues)
    await this.logAction(
      result.order.id,
      'created',
      'customer',
      userId,
      { cart, address, paymentMethod },
      'Order created successfully'
    );

    return result;
  }

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment(orderId, razorpayPaymentId, razorpaySignature) {
    // Fetch payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment) {
      throw new Error('NOT_FOUND: Payment record not found');
    }

    if (payment.status === 'success') {
      throw new Error('VALIDATION: Payment already verified');
    }

    // Verify signature
    const body = payment.razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      // Update payment as failed
      await db.update(payments)
        .set({
          status: 'failed',
          failureReason: 'Invalid signature',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      throw new Error('PAYMENT: Payment verification failed - invalid signature');
    }

    // Transaction to update payment and order
    await db.transaction(async (tx) => {
      // Update payment
      await tx.update(payments)
        .set({
          razorpayPaymentId,
          razorpaySignature,
          status: 'success',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // Update order status
      await tx.update(orders)
        .set({
          status: 'awaiting_assignment',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Log payment success
      await this.logAction(
        orderId,
        'payment_success',
        'system',
        null,
        { razorpayPaymentId },
        'Payment verified successfully'
      );
    });

    return { verified: true };
  }

  /**
   * Start vendor assignment process
   * This should be called after payment is successful or for COD orders
   */
  async startAssignment(orderId) {
    const [order] = await db
      .select({
        id: orders.id,
        orderId: orders.orderId,
        status: orders.status,
        deliveryLatitude: orders.deliveryLatitude,
        deliveryLongitude: orders.deliveryLongitude,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('NOT_FOUND: Order not found');
    }

    if (order.status !== 'awaiting_assignment') {
      throw new Error('VALIDATION: Order is not awaiting assignment');
    }

    // Find nearby vendors using Haversine formula
    // This query finds vendors within ORDER_ASSIGNMENT_MAX_RADIUS_KM
    const maxRadius = parseFloat(process.env.ORDER_ASSIGNMENT_MAX_RADIUS_KM || 10);
    const timeoutSeconds = parseInt(process.env.ORDER_ASSIGNMENT_TIMEOUT || 120);

    const nearbyVendors = await db.execute(sql`
      SELECT 
        v.id,
        v.user_id,
        v.latitude,
        v.longitude,
        (
          6371 * acos(
            cos(radians(${order.deliveryLatitude})) 
            * cos(radians(v.latitude)) 
            * cos(radians(v.longitude) - radians(${order.deliveryLongitude})) 
            + sin(radians(${order.deliveryLatitude})) 
            * sin(radians(v.latitude))
          )
        ) AS distance
      FROM vendors v
      INNER JOIN users u ON v.user_id = u.id
      WHERE v.status = 'approved'
        AND u.role = 'vendor'
        AND u.is_active = 'true'
      HAVING distance <= ${maxRadius}
      ORDER BY distance ASC
      LIMIT ${parseInt(process.env.ORDER_ASSIGNMENT_BATCH_SIZE || 5)}
    `);

    if (nearbyVendors.rows.length === 0) {
      await this.logAction(
        orderId,
        'assignment_failed',
        'system',
        null,
        { reason: 'no_vendors_nearby', radius: maxRadius },
        'No vendors available nearby'
      );
      throw new Error('ASSIGNMENT: No vendors available in your area');
    }

    // Create assignment records
    const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);
    const assignments = [];

    await db.transaction(async (tx) => {
      for (const vendor of nearbyVendors.rows) {
        const [assignment] = await tx.insert(orderAssignments).values({
          orderId: order.id,
          vendorId: vendor.id,
          status: 'pending',
          distance: vendor.distance,
          notifiedVia: 'socket',
          assignedAt: new Date(),
          expiresAt,
          createdAt: new Date(),
        }).returning();

        assignments.push(assignment);
      }

      // Update order status
      await tx.update(orders)
        .set({
          status: 'assigned',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Log assignment
      await this.logAction(
        orderId,
        'assigned',
        'system',
        null,
        { vendorCount: nearbyVendors.rows.length, timeout: timeoutSeconds },
        `Order assigned to ${nearbyVendors.rows.length} nearby vendors`
      );
    });

    return {
      assignments,
      vendors: nearbyVendors.rows,
    };
  }

  /**
   * Vendor accepts order (called after Redis atomic lock succeeds)
   */
  async vendorAccept(orderId, vendorId) {
    await db.transaction(async (tx) => {
      // Check order status
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('NOT_FOUND: Order not found');
      }

      if (order.status !== 'assigned') {
        throw new Error('VALIDATION: Order is no longer available for acceptance');
      }

      if (order.assignedVendorId) {
        throw new Error('CONFLICT: Order already accepted by another vendor');
      }

      // Check if vendor has pending assignment
      const [assignment] = await tx
        .select()
        .from(orderAssignments)
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.vendorId, vendorId),
            eq(orderAssignments.status, 'pending')
          )
        )
        .limit(1);

      if (!assignment) {
        throw new Error('FORBIDDEN: Vendor not assigned to this order');
      }

      if (new Date() > assignment.expiresAt) {
        throw new Error('VALIDATION: Assignment has expired');
      }

      // Update order
      await tx.update(orders)
        .set({
          assignedVendorId: vendorId,
          status: 'vendor_accepted',
          assignedAt: new Date(),
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Update accepted assignment
      await tx.update(orderAssignments)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
        })
        .where(eq(orderAssignments.id, assignment.id));

      // Reject other pending assignments
      await tx.update(orderAssignments)
        .set({
          status: 'cancelled',
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.status, 'pending')
          )
        );

      // Log acceptance
      await this.logAction(
        orderId,
        'vendor_accepted',
        'vendor',
        null,
        { vendorId },
        'Vendor accepted the order'
      );
    });

    return { accepted: true };
  }

  /**
   * Vendor rejects order
   */
  async vendorReject(orderId, vendorId, reason = null) {
    await db.transaction(async (tx) => {
      // Find assignment
      const [assignment] = await tx
        .select()
        .from(orderAssignments)
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.vendorId, vendorId),
            eq(orderAssignments.status, 'pending')
          )
        )
        .limit(1);

      if (!assignment) {
        throw new Error('NOT_FOUND: Assignment not found or already responded');
      }

      // Update assignment
      await tx.update(orderAssignments)
        .set({
          status: 'rejected',
          respondedAt: new Date(),
        })
        .where(eq(orderAssignments.id, assignment.id));

      // Check if all vendors rejected
      const pendingAssignments = await tx
        .select()
        .from(orderAssignments)
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.status, 'pending')
          )
        );

      // Log rejection
      await this.logAction(
        orderId,
        'vendor_rejected',
        'vendor',
        null,
        { vendorId, reason },
        'Vendor rejected the order'
      );

      // If no pending assignments, need to reassign or cancel
      if (pendingAssignments.length === 0) {
        await this.logAction(
          orderId,
          'all_vendors_rejected',
          'system',
          null,
          null,
          'All assigned vendors rejected the order'
        );
      }
    });

    return { rejected: true };
  }

  /**
   * Mark order status (vendor workflow)
   */
  async markStatus(orderId, vendorId, newStatus) {
    const validTransitions = {
      vendor_accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('NOT_FOUND: Order not found');
    }

    if (order.assignedVendorId !== vendorId) {
      throw new Error('FORBIDDEN: Order not assigned to this vendor');
    }

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses || !allowedStatuses.includes(newStatus)) {
      throw new Error(`VALIDATION: Cannot transition from ${order.status} to ${newStatus}`);
    }

    const updateData = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'in_progress') {
      updateData.startedAt = new Date();
    } else if (newStatus === 'completed') {
      updateData.completedAt = new Date();
    } else if (newStatus === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    await this.logAction(
      orderId,
      `status_${newStatus}`,
      'vendor',
      null,
      { vendorId },
      `Order status changed to ${newStatus}`
    );

    return { updated: true, status: newStatus };
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, actor, reason) {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('NOT_FOUND: Order not found');
      }

      // Check if cancellation is allowed
      const nonCancellableStatuses = ['completed', 'cancelled', 'refunded'];
      if (nonCancellableStatuses.includes(order.status)) {
        throw new Error(`VALIDATION: Cannot cancel order with status ${order.status}`);
      }

      // Update order
      await tx.update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
          cancelledBy: actor.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Restore stock
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        await tx.execute(sql`
          UPDATE items 
          SET stock = stock + ${item.quantity},
              updated_at = NOW()
          WHERE id = ${item.itemId}
        `);
      }

      // Cancel pending assignments
      await tx.update(orderAssignments)
        .set({
          status: 'cancelled',
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.status, 'pending')
          )
        );

      // Log cancellation
      await this.logAction(
        orderId,
        'cancelled',
        actor.role,
        actor.id,
        { reason },
        `Order cancelled: ${reason}`
      );
    });

    // Get updated order
    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    return updatedOrder;
  }

  /**
   * Get order details by ID
   */
  async getOrderById(orderId, actor) {
    const [order] = await db
      .select({
        id: orders.id,
        orderId: orders.orderId,
        userId: orders.userId,
        deliveryAddress: orders.deliveryAddress,
        deliveryLatitude: orders.deliveryLatitude,
        deliveryLongitude: orders.deliveryLongitude,
        deliveryPhone: orders.deliveryPhone,
        subtotal: orders.subtotal,
        tax: orders.tax,
        deliveryFee: orders.deliveryFee,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        assignedVendorId: orders.assignedVendorId,
        assignedAt: orders.assignedAt,
        acceptedAt: orders.acceptedAt,
        startedAt: orders.startedAt,
        completedAt: orders.completedAt,
        cancelledAt: orders.cancelledAt,
        cancellationReason: orders.cancellationReason,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: users.name,
        customerPhone: users.phoneNumber,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('NOT_FOUND: Order not found');
    }

    // Authorization check
    if (actor.role === 'customer' && order.userId !== actor.id) {
      throw new Error('FORBIDDEN: Cannot view other user\'s orders');
    }

    if (actor.role === 'vendor') {
      // Vendor can only see assigned orders
      const [assignment] = await db
        .select()
        .from(orderAssignments)
        .where(
          and(
            eq(orderAssignments.orderId, orderId),
            eq(orderAssignments.vendorId, actor.vendorId)
          )
        )
        .limit(1);

      if (!assignment) {
        throw new Error('FORBIDDEN: Order not assigned to this vendor');
      }
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Fetch payment
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    return {
      ...order,
      items,
      payment,
    };
  }

  /**
   * List orders for user
   */
  async listUserOrders(userId, filters = {}) {
    const { page = 1, limit = 20, status } = filters;
    const offset = (page - 1) * limit;

    let conditions = [eq(orders.userId, userId)];

    // Validate status is a valid enum value
    if (status) {
      const validStatuses = [
        'pending_payment', 'payment_failed', 'awaiting_assignment',
        'assigned', 'vendor_accepted', 'in_progress', 'completed',
        'cancelled', 'refunded'
      ];
      if (validStatuses.includes(status)) {
        conditions.push(eq(orders.status, status));
      }
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [{ count }] = await db
      .select({ count: sql`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const ordersList = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders: ordersList,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default new OrderService();
