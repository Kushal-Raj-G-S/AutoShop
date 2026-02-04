/**
 * ORDER ASSIGNMENT ENGINE - CONTROLLER LAYER
 * 
 * HTTP endpoints for vendor assignment operations
 */

import { sendResponse } from '../../../utils/response.js';
import AssignmentService from './assignment.service.js';

class AssignmentController {
  /**
   * Vendor accepts order
   * POST /api/vendor/orders/:orderId/accept
   */
  async acceptOrder(req, res) {
    try {
      const { orderId } = req.params;
      const vendorId = req.user.vendorId; // Assuming vendor profile linked to user

      if (!orderId || isNaN(parseInt(orderId))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      if (!vendorId) {
        return sendResponse(res, 403, false, 'Vendor profile not found');
      }

      // Get Redis and Socket.io from app
      const redis = req.app.get('redis');
      const io = req.app.get('io');

      if (!redis) {
        return sendResponse(res, 503, false, 'Assignment service unavailable (Redis)');
      }

      const assignmentService = new AssignmentService(redis, io);
      const result = await assignmentService.vendorAccept(parseInt(orderId), vendorId);

      if (!result.success) {
        return sendResponse(res, 409, false, result.reason || 'Unable to accept order', result);
      }

      return sendResponse(res, 200, true, 'Order accepted successfully', result);

    } catch (error) {
      console.error('❌ Accept order error:', error);

      if (error.message.startsWith('NOT_FOUND:')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('EXPIRED:')) {
        return sendResponse(res, 410, false, error.message.replace('EXPIRED: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to accept order', { error: error.message });
    }
  }

  /**
   * Vendor rejects order
   * POST /api/vendor/orders/:orderId/reject
   */
  async rejectOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const vendorId = req.user.vendorId;

      if (!orderId || isNaN(parseInt(orderId))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      if (!vendorId) {
        return sendResponse(res, 403, false, 'Vendor profile not found');
      }

      const redis = req.app.get('redis');
      const io = req.app.get('io');

      const assignmentService = new AssignmentService(redis, io);
      const result = await assignmentService.vendorReject(
        parseInt(orderId),
        vendorId,
        reason || 'Vendor declined'
      );

      return sendResponse(res, 200, true, 'Order rejected', result);

    } catch (error) {
      console.error('❌ Reject order error:', error);
      return sendResponse(res, 500, false, 'Failed to reject order', { error: error.message });
    }
  }

  /**
   * Admin force-assigns order to vendor
   * POST /api/admin/orders/:orderId/force-assign
   */
  async forceAssign(req, res) {
    try {
      const { orderId } = req.params;
      const { vendorId } = req.body;

      if (!orderId || isNaN(parseInt(orderId))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      if (!vendorId || isNaN(parseInt(vendorId))) {
        return sendResponse(res, 400, false, 'Invalid vendor ID');
      }

      const redis = req.app.get('redis');
      const io = req.app.get('io');

      const assignmentService = new AssignmentService(redis, io);
      const result = await assignmentService.forceAssign(
        parseInt(orderId),
        parseInt(vendorId)
      );

      return sendResponse(res, 200, true, 'Order force-assigned successfully', result);

    } catch (error) {
      console.error('❌ Force assign error:', error);

      if (error.message.startsWith('NOT_FOUND:')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to force-assign order', { error: error.message });
    }
  }

  /**
   * Get assignment history for an order
   * GET /api/admin/orders/:orderId/assignments
   */
  async getAssignmentHistory(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId || isNaN(parseInt(orderId))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      const redis = req.app.get('redis');
      const io = req.app.get('io');

      const assignmentService = new AssignmentService(redis, io);
      const history = await assignmentService.getAssignmentHistory(parseInt(orderId));

      return sendResponse(res, 200, true, 'Assignment history retrieved', {
        orderId: parseInt(orderId),
        assignments: history,
      });

    } catch (error) {
      console.error('❌ Get assignment history error:', error);
      return sendResponse(res, 500, false, 'Failed to retrieve assignment history', { error: error.message });
    }
  }

  /**
   * Start manual assignment (admin)
   * POST /api/admin/orders/:orderId/start-assignment
   */
  async startAssignment(req, res) {
    try {
      const { orderId } = req.params;
      const options = req.body; // Can include maxRadius, parallelPushCount, etc.

      if (!orderId || isNaN(parseInt(orderId))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      const redis = req.app.get('redis');
      const io = req.app.get('io');

      if (!redis || !io) {
        return sendResponse(res, 503, false, 'Assignment service unavailable');
      }

      const assignmentService = new AssignmentService(redis, io);
      const result = await assignmentService.startAssignment(parseInt(orderId), options);

      return sendResponse(res, 200, true, 'Assignment started successfully', result);

    } catch (error) {
      console.error('❌ Start assignment error:', error);

      if (error.message.startsWith('NOT_FOUND:')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('INVALID_STATE:')) {
        return sendResponse(res, 400, false, error.message.replace('INVALID_STATE: ', ''));
      }

      if (error.message.startsWith('NO_VENDORS:')) {
        return sendResponse(res, 404, false, error.message.replace('NO_VENDORS: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to start assignment', { error: error.message });
    }
  }
}

export default new AssignmentController();
