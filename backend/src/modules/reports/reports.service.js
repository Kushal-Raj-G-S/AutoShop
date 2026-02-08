import { db } from '../../db/index.js';
import { orders, items, vendors, users, orderItems, categories, subCategories, units } from '../../db/schema.js';
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
        conditions.push(eq(orders.assignedVendorId, vendorId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get orders with user and vendor info
      const ordersData = await db
        .select({
          id: orders.id,
          orderId: orders.orderId,
          userId: orders.userId,
          userName: users.name,
          userPhone: users.phoneNumber,
          assignedVendorId: orders.assignedVendorId,
          vendorName: vendors.storeName,
          vendorPhone: vendors.phone,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.tax,
          deliveryFee: orders.deliveryFee,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          deliveryAddress: orders.deliveryAddress,
          createdAt: orders.createdAt,
          completedAt: orders.completedAt,
          cancelledAt: orders.cancelledAt,
          assignedAt: orders.assignedAt,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(vendors, eq(orders.assignedVendorId, vendors.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt));

      // Calculate summary statistics
      const summary = {
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum, order) => sum + parseFloat(order.total || 0), 0),
        totalDeliveryFees: ordersData.reduce((sum, order) => sum + parseFloat(order.deliveryFee || 0), 0),
        totalTax: ordersData.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0),
        totalSubtotal: ordersData.reduce((sum, order) => sum + parseFloat(order.subtotal || 0), 0),
        byStatus: {},
        byPaymentMethod: {},
      };

      // Group by status and payment method
      ordersData.forEach((order) => {
        summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1;
        summary.byPaymentMethod[order.paymentMethod] = (summary.byPaymentMethod[order.paymentMethod] || 0) + 1;
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
      const conditions = [eq(orders.status, 'completed')];

      if (startDate) {
        conditions.push(gte(orders.completedAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(orders.completedAt, new Date(endDate)));
      }

      if (vendorId) {
        conditions.push(eq(orders.assignedVendorId, vendorId));
      }

      const whereClause = and(...conditions);

      // Get completed orders
      const payoutOrders = await db
        .select({
          id: orders.id,
          orderId: orders.orderId,
          assignedVendorId: orders.assignedVendorId,
          vendorName: vendors.storeName,
          vendorPhone: vendors.phone,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.tax,
          deliveryFee: orders.deliveryFee,
          total: orders.total,
          completedAt: orders.completedAt,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(vendors, eq(orders.assignedVendorId, vendors.id))
        .where(whereClause)
        .orderBy(desc(orders.completedAt));

      // Calculate payouts by vendor (assuming 10% platform fee)
      const vendorPayouts = {};
      payoutOrders.forEach((order) => {
        const vendorId = order.assignedVendorId;
        if (!vendorId) return;
        
        const platformFee = parseFloat(order.total || 0) * 0.1;
        const netPayout = parseFloat(order.total || 0) - platformFee;
        
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
        vendorPayouts[vendorId].totalRevenue += parseFloat(order.total || 0);
        vendorPayouts[vendorId].totalPlatformFees += platformFee;
        vendorPayouts[vendorId].netPayout += netPayout;
      });

      const summary = {
        totalOrders: payoutOrders.length,
        totalRevenue: payoutOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
        totalPlatformFees: payoutOrders.reduce((sum, o) => sum + (parseFloat(o.total || 0) * 0.1), 0),
        totalNetPayouts: payoutOrders.reduce((sum, o) => sum + (parseFloat(o.total || 0) * 0.9), 0),
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
      // Get all items with category and unit info (vendors are not directly related to items)
      const inventoryData = await db
        .select({
          id: items.id,
          name: items.name,
          description: items.description,
          categoryId: items.categoryId,
          categoryName: categories.name,
          subCategoryId: items.subCategoryId,
          subCategoryName: subCategories.name,
          unitId: items.unitId,
          unitName: units.name,
          price: items.price,
          stock: items.stock,
          isActive: items.isActive,
          createdAt: items.createdAt,
          updatedAt: items.updatedAt,
        })
        .from(items)
        .leftJoin(categories, eq(items.categoryId, categories.id))
        .leftJoin(subCategories, eq(items.subCategoryId, subCategories.id))
        .leftJoin(units, eq(items.unitId, units.id))
        .orderBy(items.name);

      // Calculate statistics
      const summary = {
        totalItems: inventoryData.length,
        activeItems: inventoryData.filter((item) => item.isActive === 'true').length,
        inactiveItems: inventoryData.filter((item) => item.isActive !== 'true').length,
        outOfStock: inventoryData.filter((item) => item.stock === 0).length,
        lowStock: inventoryData.filter((item) => item.stock > 0 && item.stock <= 10).length,
        totalStockValue: inventoryData.reduce(
          (sum, item) => sum + parseFloat(item.price || 0) * (item.stock || 0),
          0
        ),
        byCategory: {},
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
          const orderConditions = [eq(orders.assignedVendorId, vendor.id)];

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

          // Calculate stats (items are not directly linked to vendors in current schema)
          const stats = {
            totalOrders: vendorOrders.length,
            completedOrders: vendorOrders.filter((o) => o.status === 'completed').length,
            cancelledOrders: vendorOrders.filter((o) => o.status === 'cancelled').length,
            pendingOrders: vendorOrders.filter((o) =>
              ['pending_payment', 'awaiting_assignment', 'assigned', 'vendor_accepted', 'in_progress'].includes(o.status)
            ).length,
            totalRevenue: vendorOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
            averageOrderValue:
              vendorOrders.length > 0
                ? vendorOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) / vendorOrders.length
                : 0,
          };

          return {
            vendorId: vendor.id,
            vendorName: vendor.storeName,
            vendorPhone: vendor.phone,
            ownerName: vendor.ownerName,
            storeAddress: vendor.storeAddress,
            status: vendor.status,
            ...stats,
          };
        })
      );

      const summary = {
        totalVendors: vendorReports.length,
        activeVendors: vendorReports.filter((v) => v.status === 'approved').length,
        totalOrders: vendorReports.reduce((sum, v) => sum + v.totalOrders, 0),
        totalRevenue: vendorReports.reduce((sum, v) => sum + v.totalRevenue, 0),
        averageOrdersPerVendor:
          vendorReports.length > 0
            ? vendorReports.reduce((sum, v) => sum + v.totalOrders, 0) / vendorReports.length
            : 0,
        averageRevenuePerVendor:
          vendorReports.length > 0
            ? vendorReports.reduce((sum, v) => sum + v.totalRevenue, 0) / vendorReports.length
            : 0,
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
