import { db } from '../../db/index.js';
import { orders, orderItems, users, vendors } from '../../db/schema.js';
import { eq, desc, or, like, and, sql, count, inArray } from 'drizzle-orm';

class AdminOrdersService {
  /**
   * Get paginated orders with filtering and search
   */
  async getOrders({ page = 1, limit = 20, status, search }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];

      // Filter by status if provided
      if (status) {
        // Map frontend status values to backend enum values
        const statusMap = {
          'pending': 'pending_payment',
          'assigned': 'assigned',
          'in-progress': 'in_progress',
          'in_progress': 'in_progress',
          'completed': 'completed',
          'cancelled': 'cancelled',
        };
        const mappedStatus = statusMap[status] || status;
        conditions.push(eq(orders.status, mappedStatus));
      }

      // Search by orderId or customer phone
      if (search) {
        conditions.push(
          or(
            like(orders.orderId, `%${search}%`),
            like(orders.deliveryPhone, `%${search}%`)
          )
        );
      }

      // Build where clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count for pagination
      const [totalCountResult] = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);

      const totalCount = Number(totalCountResult?.count || 0);

      // Fetch orders with user and vendor details
      const ordersData = await db
        .select({
          id: orders.id,
          orderId: orders.orderId,
          customerPhone: orders.deliveryPhone,
          customerName: users.name,
          customerId: users.id,
          vendorId: vendors.id,
          vendorStoreName: vendors.storeName,
          amount: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          paymentMethod: orders.paymentMethod,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(vendors, eq(orders.assignedVendorId, vendors.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      // Get item count for each order
      const orderIds = ordersData.map(o => o.id);
      let itemCounts = [];
      
      if (orderIds.length > 0) {
        itemCounts = await db
          .select({
            orderId: orderItems.orderId,
            itemCount: count(),
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
          .groupBy(orderItems.orderId);
      }

      // Create a map of order ID to item count
      const itemCountMap = {};
      itemCounts.forEach(ic => {
        itemCountMap[ic.orderId] = Number(ic.itemCount);
      });

      // Enrich orders with item count
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        itemCount: itemCountMap[order.id] || 0,
        amount: Number(order.amount),
      }));

      return {
        orders: enrichedOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get recent orders (last 10)
   */
  async getRecentOrders() {
    try {
      const ordersData = await db
        .select({
          id: orders.id,
          orderId: orders.orderId,
          customerPhone: orders.deliveryPhone,
          customerName: users.name,
          customerId: users.id,
          vendorId: vendors.id,
          vendorStoreName: vendors.storeName,
          amount: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          paymentMethod: orders.paymentMethod,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(vendors, eq(orders.assignedVendorId, vendors.id))
        .orderBy(desc(orders.createdAt))
        .limit(10);

      // Get item count for each order
      const orderIds = ordersData.map(o => o.id);
      
      let itemCounts = [];
      if (orderIds.length > 0) {
        itemCounts = await db
          .select({
            orderId: orderItems.orderId,
            itemCount: count(),
          })
          .from(orderItems)
          .where(sql`${orderItems.orderId} = ANY(${orderIds})`)
          .groupBy(orderItems.orderId);
      }

      // Create a map of order ID to item count
      const itemCountMap = {};
      itemCounts.forEach(ic => {
        itemCountMap[ic.orderId] = Number(ic.itemCount);
      });

      // Enrich orders with item count
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        itemCount: itemCountMap[order.id] || 0,
        amount: Number(order.amount),
      }));

      return enrichedOrders;
    } catch (error) {
      console.error('Error in getRecentOrders:', error);
      throw new Error('Failed to fetch recent orders');
    }
  }

  /**
   * Get order by ID with full details
   */
  async getOrderById(orderId) {
    try {
      const [order] = await db
        .select({
          id: orders.id,
          orderId: orders.orderId,
          customerPhone: orders.deliveryPhone,
          customerName: users.name,
          customerId: users.id,
          vendorId: vendors.id,
          vendorStoreName: vendors.storeName,
          vendorPhone: vendors.phone,
          amount: orders.total,
          subtotal: orders.subtotal,
          tax: orders.tax,
          deliveryFee: orders.deliveryFee,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          deliveryAddress: orders.deliveryAddress,
          deliveryLatitude: orders.deliveryLatitude,
          deliveryLongitude: orders.deliveryLongitude,
          createdAt: orders.createdAt,
          assignedAt: orders.assignedAt,
          acceptedAt: orders.acceptedAt,
          startedAt: orders.startedAt,
          completedAt: orders.completedAt,
          cancelledAt: orders.cancelledAt,
          cancellationReason: orders.cancellationReason,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(vendors, eq(orders.assignedVendorId, vendors.id))
        .where(eq(orders.id, orderId));

      if (!order) {
        throw new Error('Order not found');
      }

      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      return {
        ...order,
        items: items.map(item => ({
          ...item,
          price: Number(item.price),
          total: Number(item.total),
        })),
        amount: Number(order.amount),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        deliveryFee: Number(order.deliveryFee),
      };
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }

  /**
   * Force assign order to a vendor (admin action)
   */
  async forceAssignOrder(orderId, vendorId) {
    try {
      console.log(`🔧 Force assigning order ${orderId} to vendor ${vendorId}`);
      
      // Get current order state to check for reassignment
      const [currentOrder] = await db
        .select({
          id: orders.id,
          assignedVendorId: orders.assignedVendorId,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      const isReassignment = currentOrder.assignedVendorId !== null && 
                            currentOrder.assignedVendorId !== vendorId;
      
      // Verify new vendor exists
      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId));

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Get previous vendor info if this is a reassignment
      let previousVendor = null;
      if (isReassignment) {
        [previousVendor] = await db
          .select({ storeName: vendors.storeName, id: vendors.id })
          .from(vendors)
          .where(eq(vendors.id, currentOrder.assignedVendorId));
      }

      // Update order
      const [updatedOrder] = await db
        .update(orders)
        .set({
          assignedVendorId: vendorId,
          status: 'assigned',
          assignedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (isReassignment) {
        console.log(`🔄 Order ${orderId} REASSIGNED from vendor ${previousVendor?.storeName} (ID: ${previousVendor?.id}) to ${vendor.storeName} (ID: ${vendorId})`);
      } else {
        console.log(`✅ Order ${orderId} assigned with status: ${updatedOrder.status}`);
      }
      
      return updatedOrder;
    } catch (error) {
      console.error('Error in forceAssignOrder:', error);
      throw error;
    }
  }

  /**
   * Cancel order (admin action)
   */
  async cancelOrder(orderId, reason = 'Cancelled by admin') {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      throw error;
    }
  }

  /**
   * Prepare order for assignment (update status)
   */
  async prepareOrderForAssignment(orderId) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // Update to awaiting_assignment if not already in a valid assignment state
      const validStatuses = ['awaiting_assignment', 'payment_verified', 'paid'];
      if (!validStatuses.includes(order.status)) {
        await db
          .update(orders)
          .set({
            status: 'awaiting_assignment',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
        
        console.log(`✅ Order ${orderId} status updated to awaiting_assignment`);
      }

      return order;
    } catch (error) {
      console.error('Error in prepareOrderForAssignment:', error);
      throw error;
    }
  }

  /**
   * Trigger auto-assignment for an order (deprecated - use controller directly)
   */
  async triggerAutoAssignment(orderId, options = {}) {
    // This method is now just a placeholder
    // The actual assignment is triggered in the controller
    return {
      orderId,
      status: 'awaiting_assignment',
      message: 'Order prepared for auto-assignment',
    };
  }

  /**
   * Get nearby vendors for an order (for manual assignment)
   */
  async getNearbyVendorsForOrder(orderId, maxRadius = 10) {
    try {
      // Get order details
      const [order] = await db
        .select({
          deliveryLatitude: orders.deliveryLatitude,
          deliveryLongitude: orders.deliveryLongitude,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // Haversine formula for distance calculation
      const distanceFormula = sql`(
        6371 * acos(
          cos(radians(${order.deliveryLatitude})) 
          * cos(radians(${vendors.latitude})) 
          * cos(radians(${vendors.longitude}) - radians(${order.deliveryLongitude})) 
          + sin(radians(${order.deliveryLatitude})) 
          * sin(radians(${vendors.latitude}))
        )
      )`;

      // Get nearby approved vendors
      const nearbyVendors = await db
        .select({
          id: vendors.id,
          storeName: vendors.storeName,
          ownerName: vendors.ownerName,
          phone: vendors.phone,
          storeAddress: vendors.storeAddress,
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
        .orderBy(distanceFormula)
        .limit(20);

      return nearbyVendors.map(v => ({
        ...v,
        distance: Number(v.distance).toFixed(2),
      }));
    } catch (error) {
      console.error('Error in getNearbyVendorsForOrder:', error);
      throw error;
    }
  }
}

export default new AdminOrdersService();
