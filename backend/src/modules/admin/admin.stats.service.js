import { db } from '../../db/index.js';
import { vendors, categories, items, orders, orderItems, users } from '../../db/schema.js';
import { eq, count, sql, gte, and } from 'drizzle-orm';

class AdminStatsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      // Get today's date in IST timezone (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Adjust to IST (UTC +5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(today.getTime() + istOffset);

      // Count pending vendors
      const [pendingVendorsResult] = await db
        .select({ count: count() })
        .from(vendors)
        .where(eq(vendors.status, 'pending'));

      // Count active/approved vendors
      const [activeVendorsResult] = await db
        .select({ count: count() })
        .from(vendors)
        .where(eq(vendors.status, 'approved'));

      // Count total categories
      const [totalCategoriesResult] = await db
        .select({ count: count() })
        .from(categories);

      // Count total items
      const [totalItemsResult] = await db
        .select({ count: count() })
        .from(items);

      // Count total orders
      const [totalOrdersResult] = await db
        .select({ count: count() })
        .from(orders);

      // Count today's orders (based on IST timezone)
      const [todayOrdersResult] = await db
        .select({ count: count() })
        .from(orders)
        .where(gte(orders.createdAt, todayIST));

      return {
        pendingVendors: Number(pendingVendorsResult?.count || 0),
        activeVendors: Number(activeVendorsResult?.count || 0),
        totalCategories: Number(totalCategoriesResult?.count || 0),
        totalItems: Number(totalItemsResult?.count || 0),
        totalOrders: Number(totalOrdersResult?.count || 0),
        todayOrders: Number(todayOrdersResult?.count || 0),
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}

export default new AdminStatsService();
