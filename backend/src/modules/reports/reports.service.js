import { db } from '../../db/index.js';
import { orders, items, vendors, users, orderItems } from '../../db/schema.js';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';

class ReportsService {
  /**
   * Generate Orders Report
   * @param {Object} filters - { startDate, endDate, status, vendorId }
   */
  async generateOrdersReport(filters = {}) {
    try {
      const { startDate, endDate, status, vendorId } = filters;
      const conditions = [];

      if (startDate) {
        conditions.push(gte(orders.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(orders.createdAt, new Date(endDate)));
      }

      if (status) {
        conditions.push(eq(orders.status, status));
      }

      if (vendorId) {
        conditions.push(eq(orders.vendorId, vendorId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get orders with user and vendor info
      const ordersData = await (whereClause
        ? db
            .select({
              id: orders.id,
              orderNumber: orders.orderNumber,
              userId: orders.userId,
              userName: sql`users.name`,
              userPhone: sql`users.phone_number`,
              vendorId: orders.vendorId,
              vendorName: sql`vendors.business_name`,
              status: orders.status,
              totalAmount: orders.totalAmount,
              deliveryFee: orders.deliveryFee,
              gstAmount: orders.gstAmount,
              platformFee: orders.platformFee,
              finalAmount: orders.finalAmount,
              paymentMethod: orders.paymentMethod,
              paymentStatus: orders.paymentStatus,
              createdAt: orders.createdAt,
              deliveredAt: orders.deliveredAt,
            })
            .from(orders)
            .leftJoin(sql`users`, sql`orders.user_id = users.id`)
            .leftJoin(sql`vendors`, sql`orders.vendor_id = vendors.id`)
            .where(whereClause)
            .orderBy(desc(orders.createdAt))
        : db
            .select({
              id: orders.id,
              orderNumber: orders.orderNumber,
              userId: orders.userId,
              userName: sql`users.name`,
              userPhone: sql`users.phone_number`,
              vendorId: orders.vendorId,
              vendorName: sql`vendors.business_name`,
              status: orders.status,
              totalAmount: orders.totalAmount,
              deliveryFee: orders.deliveryFee,
              gstAmount: orders.gstAmount,
              platformFee: orders.platformFee,
              finalAmount: orders.finalAmount,
              paymentMethod: orders.paymentMethod,
              paymentStatus: orders.paymentStatus,
              createdAt: orders.createdAt,
              deliveredAt: orders.deliveredAt,
            })
            .from(orders)
            .leftJoin(sql`users`, sql`orders.user_id = users.id`)
            .leftJoin(sql`vendors`, sql`orders.vendor_id = vendors.id`)
            .orderBy(desc(orders.createdAt)));

      // Calculate summary statistics
      const summary = {
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum, order) => sum + parseFloat(order.finalAmount || 0), 0),
        totalDeliveryFees: ordersData.reduce((sum, order) => sum + parseFloat(order.deliveryFee || 0), 0),
        totalGST: ordersData.reduce((sum, order) => sum + parseFloat(order.gstAmount || 0), 0),
        totalPlatformFees: ordersData.reduce((sum, order) => sum + parseFloat(order.platformFee || 0), 0),
        byStatus: {},
        byPaymentMethod: {},
        byPaymentStatus: {},
      };

      // Group by status
      ordersData.forEach((order) => {
        summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1;
        summary.byPaymentMethod[order.paymentMethod] = (summary.byPaymentMethod[order.paymentMethod] || 0) + 1;
        summary.byPaymentStatus[order.paymentStatus] = (summary.byPaymentStatus[order.paymentStatus] || 0) + 1;
      });

      return {
        filters,
        summary,
        orders: ordersData,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Generate Orders Report Error:', error);
      throw new Error('Failed to generate orders report');
    }
  }

  /**
   * Generate Payouts Report
   * @param {Object} filters - { startDate, endDate, vendorId, status }
   */
  async generatePayoutsReport(filters = {}) {
    try {
      const { startDate, endDate, vendorId, status } = filters;
      const conditions = [eq(orders.paymentStatus, 'paid')];

      if (startDate) {
        conditions.push(gte(orders.deliveredAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(orders.deliveredAt, new Date(endDate)));
      }

      if (vendorId) {
        conditions.push(eq(orders.vendorId, vendorId));
      }

      if (status) {
        conditions.push(eq(orders.status, status));
      }

      const whereClause = and(...conditions);

      // Get completed paid orders
      const payoutOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          vendorId: orders.vendorId,
          vendorName: sql`vendors.business_name`,
          vendorPhone: sql`vendors.phone_number`,
          status: orders.status,
          totalAmount: orders.totalAmount,
          deliveryFee: orders.deliveryFee,
          gstAmount: orders.gstAmount,
          platformFee: orders.platformFee,
          finalAmount: orders.finalAmount,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(sql`vendors`, sql`orders.vendor_id = vendors.id`)
        .where(whereClause)
        .orderBy(desc(orders.deliveredAt));

      // Calculate payouts by vendor
      const vendorPayouts = {};
      payoutOrders.forEach((order) => {
        const vendorId = order.vendorId;
        if (!vendorPayouts[vendorId]) {
          vendorPayouts[vendorId] = {
            vendorId,
            vendorName: order.vendorName,
            vendorPhone: order.vendorPhone,
            totalOrders: 0,
            totalRevenue: 0,
            totalPlatformFees: 0,
            netPayout: 0,
          };
        }

        vendorPayouts[vendorId].totalOrders += 1;
        vendorPayouts[vendorId].totalRevenue += parseFloat(order.totalAmount || 0);
        vendorPayouts[vendorId].totalPlatformFees += parseFloat(order.platformFee || 0);
        vendorPayouts[vendorId].netPayout += 
          parseFloat(order.totalAmount || 0) - parseFloat(order.platformFee || 0);
      });

      const summary = {
        totalOrders: payoutOrders.length,
        totalRevenue: payoutOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
        totalPlatformFees: payoutOrders.reduce((sum, o) => sum + parseFloat(o.platformFee || 0), 0),
        totalNetPayouts: payoutOrders.reduce(
          (sum, o) => sum + (parseFloat(o.totalAmount || 0) - parseFloat(o.platformFee || 0)),
          0
        ),
        uniqueVendors: Object.keys(vendorPayouts).length,
      };

      return {
        filters,
        summary,
        vendorPayouts: Object.values(vendorPayouts),
        orders: payoutOrders,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Generate Payouts Report Error:', error);
      throw new Error('Failed to generate payouts report');
    }
  }

  /**
   * Generate Inventory Report
   */
  async generateInventoryReport() {
    try {
      // Get all items with vendor and category info
      const inventoryData = await db
        .select({
          id: items.id,
          name: items.name,
          description: items.description,
          categoryId: items.categoryId,
          categoryName: sql`categories.name`,
          subCategoryId: items.subCategoryId,
          subCategoryName: sql`sub_categories.name`,
          unitId: items.unitId,
          unitName: sql`units.name`,
          vendorId: items.vendorId,
          vendorName: sql`vendors.business_name`,
          price: items.price,
          stock: items.stock,
          isActive: items.isActive,
          createdAt: items.createdAt,
          updatedAt: items.updatedAt,
        })
        .from(items)
        .leftJoin(sql`categories`, sql`items.category_id = categories.id`)
        .leftJoin(sql`sub_categories`, sql`items.sub_category_id = sub_categories.id`)
        .leftJoin(sql`units`, sql`items.unit_id = units.id`)
        .leftJoin(sql`vendors`, sql`items.vendor_id = vendors.id`)
        .orderBy(items.name);

      // Calculate statistics
      const summary = {
        totalItems: inventoryData.length,
        activeItems: inventoryData.filter((item) => item.isActive).length,
        inactiveItems: inventoryData.filter((item) => !item.isActive).length,
        outOfStock: inventoryData.filter((item) => item.stock === 0).length,
        lowStock: inventoryData.filter((item) => item.stock > 0 && item.stock <= 10).length,
        totalStockValue: inventoryData.reduce(
          (sum, item) => sum + parseFloat(item.price || 0) * (item.stock || 0),
          0
        ),
        byCategory: {},
        byVendor: {},
      };

      // Group by category
      inventoryData.forEach((item) => {
        const category = item.categoryName || 'Uncategorized';
        if (!summary.byCategory[category]) {
          summary.byCategory[category] = {
            count: 0,
            totalStock: 0,
            totalValue: 0,
          };
        }
        summary.byCategory[category].count += 1;
        summary.byCategory[category].totalStock += item.stock || 0;
        summary.byCategory[category].totalValue += parseFloat(item.price || 0) * (item.stock || 0);
      });

      // Group by vendor
      inventoryData.forEach((item) => {
        const vendor = item.vendorName || 'No Vendor';
        if (!summary.byVendor[vendor]) {
          summary.byVendor[vendor] = {
            count: 0,
            totalStock: 0,
            totalValue: 0,
          };
        }
        summary.byVendor[vendor].count += 1;
        summary.byVendor[vendor].totalStock += item.stock || 0;
        summary.byVendor[vendor].totalValue += parseFloat(item.price || 0) * (item.stock || 0);
      });

      return {
        summary,
        items: inventoryData,
        lowStockItems: inventoryData.filter((item) => item.stock > 0 && item.stock <= 10),
        outOfStockItems: inventoryData.filter((item) => item.stock === 0),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Generate Inventory Report Error:', error);
      throw new Error('Failed to generate inventory report');
    }
  }

  /**
   * Generate Vendor Performance Report
   * @param {Object} filters - { startDate, endDate, vendorId }
   */
  async generateVendorReport(filters = {}) {
    try {
      const { startDate, endDate, vendorId } = filters;
      const conditions = [];

      // Get all vendors or specific vendor
      const vendorConditions = [];
      if (vendorId) {
        vendorConditions.push(eq(vendors.id, vendorId));
      }

      const vendorsData = await (vendorConditions.length > 0
        ? db.select().from(vendors).where(and(...vendorConditions))
        : db.select().from(vendors));

      // For each vendor, get statistics
      const vendorReports = await Promise.all(
        vendorsData.map(async (vendor) => {
          const orderConditions = [eq(orders.vendorId, vendor.id)];

          if (startDate) {
            orderConditions.push(gte(orders.createdAt, new Date(startDate)));
          }

          if (endDate) {
            orderConditions.push(lte(orders.createdAt, new Date(endDate)));
          }

          // Get vendor orders
          const vendorOrders = await db
            .select()
            .from(orders)
            .where(and(...orderConditions));

          // Get vendor items
          const vendorItems = await db
            .select()
            .from(items)
            .where(eq(items.vendorId, vendor.id));

          // Calculate stats
          const stats = {
            totalOrders: vendorOrders.length,
            completedOrders: vendorOrders.filter((o) => o.status === 'delivered').length,
            cancelledOrders: vendorOrders.filter((o) => o.status === 'cancelled').length,
            pendingOrders: vendorOrders.filter((o) =>
              ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
            ).length,
            totalRevenue: vendorOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
            totalItems: vendorItems.length,
            activeItems: vendorItems.filter((i) => i.isActive).length,
            outOfStockItems: vendorItems.filter((i) => i.stock === 0).length,
            averageOrderValue:
              vendorOrders.length > 0
                ? vendorOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0) / vendorOrders.length
                : 0,
          };

          return {
            vendorId: vendor.id,
            vendorName: vendor.businessName,
            vendorPhone: vendor.phoneNumber,
            vendorEmail: vendor.email,
            vendorAddress: vendor.address,
            isActive: vendor.isActive,
            ...stats,
          };
        })
      );

      const summary = {
        totalVendors: vendorReports.length,
        activeVendors: vendorReports.filter((v) => v.isActive).length,
        totalOrders: vendorReports.reduce((sum, v) => sum + v.totalOrders, 0),
        totalRevenue: vendorReports.reduce((sum, v) => sum + v.totalRevenue, 0),
        totalItems: vendorReports.reduce((sum, v) => sum + v.totalItems, 0),
      };

      return {
        filters,
        summary,
        vendors: vendorReports,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Generate Vendor Report Error:', error);
      throw new Error('Failed to generate vendor report');
    }
  }
}

export default new ReportsService();
