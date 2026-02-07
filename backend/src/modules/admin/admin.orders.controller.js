import adminOrdersService from './admin.orders.service.js';
import { sendResponse } from '../../utils/response.js';
import AssignmentService from '../orders/assignment/assignment.service.js';
import { getIO } from '../../socket.js';

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

      console.log(`🔧 Admin force-assigning order ${orderId} to vendor ${parsedVendorId}`);
      const order = await adminOrdersService.forceAssignOrder(orderId, parsedVendorId);
      console.log(`✅ Order ${orderId} force-assigned successfully with status: ${order.status}`);
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

  /**
   * GET /api/admin/orders/:id/nearby-vendors
   * Get nearby vendors for manual assignment
   */
  async getNearbyVendors(req, res) {
    try {
      const { id } = req.params;
      const { maxRadius } = req.query;

      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      const vendors = await adminOrdersService.getNearbyVendorsForOrder(
        orderId,
        maxRadius ? parseFloat(maxRadius) : 10
      );

      return sendResponse(res, 200, true, 'Nearby vendors fetched successfully', { vendors });
    } catch (error) {
      console.error('Get Nearby Vendors Error:', error);
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      return sendResponse(res, statusCode, false, error.message || 'Failed to fetch nearby vendors');
    }
  }

  /**
   * POST /api/admin/orders/:id/auto-assign
   * Trigger automatic vendor assignment
   */
  async triggerAutoAssignment(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      // First, update order status to awaiting_assignment if needed
      await adminOrdersService.prepareOrderForAssignment(orderId);

      // Get io and redis - use getIO() function instead of app.get()
      let io;
      try {
        io = getIO();
        console.log('🔍 Auto-assignment - IO from getIO():', !!io, 'Has to:', typeof io?.to);
      } catch (error) {
        console.warn('⚠️  Socket.io not initialized yet');
        io = null;
      }
      
      const redis = req.app.get('redis');

      console.log('🔍 Auto-assignment - IO available:', !!io);
      console.log('🔍 Auto-assignment - Redis available:', !!redis);

      // Create assignment service instance
      const assignmentService = new AssignmentService(redis, io);

      // Trigger the actual assignment process
      const result = await assignmentService.startAssignment(orderId, {
        maxRadius: 10, // 10km radius
        parallelPushCount: 3, // Push to 3 vendors at once
        timeoutSeconds: 120, // 2 minutes timeout
      });

      return sendResponse(res, 200, true, 'Auto-assignment triggered successfully', result);
    } catch (error) {
      console.error('Trigger Auto Assignment Error:', error);
      
      // Handle specific error types
      if (error.message.includes('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }
      if (error.message.includes('INVALID_STATE')) {
        return sendResponse(res, 400, false, error.message.replace('INVALID_STATE: ', ''));
      }
      if (error.message.includes('NO_VENDORS')) {
        return sendResponse(res, 404, false, error.message.replace('NO_VENDORS: ', ''));
      }
      
      return sendResponse(res, 500, false, error.message || 'Failed to trigger auto-assignment');
    }
  }
}

export default new AdminOrdersController();
