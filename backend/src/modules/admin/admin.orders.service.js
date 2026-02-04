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
      // Verify vendor exists
      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId));

      if (!vendor) {
        throw new Error('Vendor not found');
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

      if (!updatedOrder) {
        throw new Error('Order not found');
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
}

export default new AdminOrdersService();
