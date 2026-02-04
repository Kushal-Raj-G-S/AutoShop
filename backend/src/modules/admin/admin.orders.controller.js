import adminOrdersService from './admin.orders.service.js';
import { sendResponse } from '../../utils/response.js';

class AdminOrdersController {
  /**
   * GET /api/admin/orders
   * Get paginated orders with filtering and search
   */
  async getOrders(req, res) {
    try {
      const { page, limit, status, search } = req.query;

      const result = await adminOrdersService.getOrders({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status,
        search,
      });

      return sendResponse(res, 200, true, 'Orders fetched successfully', result);
    } catch (error) {
      console.error('Get Orders Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch orders');
    }
  }

  /**
   * GET /api/admin/orders/recent
   * Get recent orders (last 10)
   */
  async getRecentOrders(req, res) {
    try {
      const orders = await adminOrdersService.getRecentOrders();
      return sendResponse(res, 200, true, 'Recent orders fetched successfully', { orders });
    } catch (error) {
      console.error('Get Recent Orders Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch recent orders');
    }
  }

  /**
   * GET /api/admin/orders/:id
   * Get order details by ID
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);
      
      if (isNaN(orderId)) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      const order = await adminOrdersService.getOrderById(orderId);
      return sendResponse(res, 200, true, 'Order details fetched successfully', { order });
    } catch (error) {
      console.error('Get Order By ID Error:', error);
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      return sendResponse(res, statusCode, false, error.message || 'Failed to fetch order details');
    }
  }

  /**
   * POST /api/admin/orders/:id/force-assign
   * Force assign order to a vendor
   */
  async forceAssignOrder(req, res) {
    try {
      const { id } = req.params;
      const { vendorId } = req.body;

      const orderId = parseInt(id);
      const parsedVendorId = parseInt(vendorId);

      if (isNaN(orderId)) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      if (!vendorId || isNaN(parsedVendorId)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      const order = await adminOrdersService.forceAssignOrder(orderId, parsedVendorId);
      return sendResponse(res, 200, true, 'Order assigned to vendor successfully', { order });
    } catch (error) {
      console.error('Force Assign Order Error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendResponse(res, statusCode, false, error.message || 'Failed to assign order');
    }
  }

  /**
   * POST /api/admin/orders/:id/cancel
   * Cancel an order
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      const order = await adminOrdersService.cancelOrder(orderId, reason);
      return sendResponse(res, 200, true, 'Order cancelled successfully', { order });
    } catch (error) {
      console.error('Cancel Order Error:', error);
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      return sendResponse(res, statusCode, false, error.message || 'Failed to cancel order');
    }
  }
}

export default new AdminOrdersController();
