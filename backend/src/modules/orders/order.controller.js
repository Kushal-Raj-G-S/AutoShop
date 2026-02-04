import orderService from './order.service.js';
import assignmentService from './assignment/assignment.service.js';
import { sendResponse } from '../../utils/response.js';

class OrderController {
  /**
   * Create new order
   * POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { cart, address, paymentMethod } = req.body;

      // Validation
      const errors = [];

      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        errors.push('cart is required and must be a non-empty array');
      }

      if (cart) {
        cart.forEach((item, index) => {
          if (!item.itemId || typeof item.itemId !== 'number') {
            errors.push(`cart[${index}].itemId must be a number`);
          }
          if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
            errors.push(`cart[${index}].quantity must be a positive number`);
          }
        });
      }

      if (!address || typeof address !== 'object') {
        errors.push('address is required');
      } else {
        if (!address.address || typeof address.address !== 'string') {
          errors.push('address.address is required');
        }
        if (typeof address.latitude !== 'number') {
          errors.push('address.latitude must be a number');
        }
        if (typeof address.longitude !== 'number') {
          errors.push('address.longitude must be a number');
        }
        if (!address.phone || typeof address.phone !== 'string') {
          errors.push('address.phone is required');
        }
      }

      if (!paymentMethod || !['razorpay', 'cod', 'wallet'].includes(paymentMethod)) {
        errors.push('paymentMethod must be one of: razorpay, cod, wallet');
      }

      if (errors.length > 0) {
        return sendResponse(res, 400, false, 'Validation failed', { errors });
      }

      const result = await orderService.createOrder(userId, cart, address, paymentMethod);

      // If COD, immediately start assignment
      if (paymentMethod === 'cod') {
        try {
          const assignment = await assignmentService.startAssignment(result.order.id);
          
          // Emit socket event to vendors
          const io = req.app.get('io');
          if (io && typeof io.to === 'function') {
            assignment.vendors.forEach(vendor => {
              io.to(`vendor_${vendor.user_id}`).emit('NEW_ORDER', {
                orderId: result.order.id,
                orderDisplayId: result.order.orderId,
                distance: vendor.distance,
                total: result.order.total,
                deliveryAddress: result.order.deliveryAddress,
                expiresAt: assignment.assignments[0].expiresAt,
              });
            });
          }
        } catch (error) {
          console.error('Failed to start assignment for COD order:', error);
          // Don't fail the order creation, log it for manual intervention
        }
      }

      return sendResponse(res, 201, true, 'Order created successfully', {
        order: result.order,
        payment: result.payment,
        razorpayOrder: result.razorpayOrder,
      });
    } catch (error) {
      console.error('Create Order Error:', error);

      if (error.message.startsWith('VALIDATION')) {
        return sendResponse(res, 400, false, error.message.replace('VALIDATION: ', ''));
      }

      if (error.message.startsWith('PAYMENT')) {
        return sendResponse(res, 402, false, error.message.replace('PAYMENT: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to create order', { error: error.message });
    }
  }

  /**
   * Verify Razorpay payment
   * POST /api/orders/verify-payment
   */
  async verifyPayment(req, res) {
    try {
      const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!orderId || !razorpayPaymentId || !razorpaySignature) {
        return sendResponse(res, 400, false, 'orderId, razorpayPaymentId, and razorpaySignature are required');
      }

      await orderService.verifyPayment(
        parseInt(orderId),
        razorpayPaymentId,
        razorpaySignature
      );

      // Start vendor assignment
      try {
        const assignment = await orderService.startAssignment(parseInt(orderId));
        
        // Emit socket event to vendors
        const io = req.app.get('io');
        if (io && typeof io.to === 'function') {
          assignment.vendors.forEach(vendor => {
            io.to(`vendor_${vendor.user_id}`).emit('NEW_ORDER', {
              orderId: parseInt(orderId),
              orderDisplayId: assignment.assignments[0].orderId,
              distance: vendor.distance,
              total: '0', // Fetch from order if needed
              expiresAt: assignment.assignments[0].expiresAt,
            });
          });
        }
      } catch (assignmentError) {
        console.error('Assignment failed after payment:', assignmentError);
        // Payment is verified, log error for manual intervention
      }

      return sendResponse(res, 200, true, 'Payment verified successfully');
    } catch (error) {
      console.error('Verify Payment Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('VALIDATION') || error.message.startsWith('PAYMENT')) {
        return sendResponse(res, 400, false, error.message.replace(/^(VALIDATION|PAYMENT): /, ''));
      }

      return sendResponse(res, 500, false, 'Failed to verify payment', { error: error.message });
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const actor = req.user;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      const order = await orderService.getOrderById(parseInt(id), actor);

      return sendResponse(res, 200, true, 'Order fetched successfully', { order });
    } catch (error) {
      console.error('Get Order Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to fetch order', { error: error.message });
    }
  }

  /**
   * List user's orders
   * GET /api/orders
   */
  async listOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, status } = req.query;

      const result = await orderService.listUserOrders(userId, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status,
      });

      return sendResponse(res, 200, true, 'Orders fetched successfully', result);
    } catch (error) {
      console.error('List Orders Error:', error);
      return sendResponse(res, 500, false, 'Failed to fetch orders', { error: error.message });
    }
  }

  /**
   * Vendor accepts order (HTTP fallback)
   * POST /api/vendor/orders/:id/accept
   */
  async vendorAcceptOrder(req, res) {
    try {
      const { id } = req.params;
      
      // Get vendor from user
      const vendor = await orderService.getVendorByUserId(req.user.id);
      if (!vendor) {
        return sendResponse(res, 403, false, 'User is not a vendor');
      }
      const vendorId = vendor.id;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      // Attempt Redis lock (see redis integration snippet)
      const redis = req.app.get('redis');
      const lockKey = `order:${id}:lock`;
      const lockValue = `vendor:${vendorId}:${Date.now()}`;
      
      // Try to acquire lock (atomic operation)
      const locked = await redis.set(lockKey, lockValue, {
        NX: true, // Only set if not exists
        EX: 10, // Expire in 10 seconds
      });

      if (!locked) {
        return sendResponse(res, 409, false, 'Order already accepted by another vendor');
      }

      try {
        // Proceed with database transaction
        await orderService.vendorAccept(parseInt(id), vendorId);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
          io.to(`order_${id}`).emit('ORDER_ACCEPTED', {
            orderId: parseInt(id),
            vendorId,
          });
        }

        return sendResponse(res, 200, true, 'Order accepted successfully');
      } catch (error) {
        // Release lock on error
        await redis.del(lockKey);
        throw error;
      }
    } catch (error) {
      console.error('Vendor Accept Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('VALIDATION')) {
        return sendResponse(res, 400, false, error.message.replace('VALIDATION: ', ''));
      }

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      if (error.message.startsWith('CONFLICT')) {
        return sendResponse(res, 409, false, error.message.replace('CONFLICT: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to accept order', { error: error.message });
    }
  }

  /**
   * Vendor rejects order
   * POST /api/vendor/orders/:id/reject
   */
  async vendorRejectOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Get vendor from user
      const vendor = await orderService.getVendorByUserId(req.user.id);
      if (!vendor) {
        return sendResponse(res, 403, false, 'User is not a vendor');
      }
      const vendorId = vendor.id;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      await orderService.vendorReject(parseInt(id), vendorId, reason);

      return sendResponse(res, 200, true, 'Order rejected successfully');
    } catch (error) {
      console.error('Vendor Reject Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to reject order', { error: error.message });
    }
  }

  /**
   * Update order status (vendor workflow)
   * PATCH /api/vendor/orders/:id/status
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Get vendor from user
      const vendor = await orderService.getVendorByUserId(req.user.id);
      if (!vendor) {
        return sendResponse(res, 403, false, 'User is not a vendor');
      }
      const vendorId = vendor.id;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      if (!status) {
        return sendResponse(res, 400, false, 'Status is required');
      }

      await orderService.markStatus(parseInt(id), vendorId, status);

      // Emit socket event
      const io = req.app.get('io');
      if (io && typeof io.to === 'function') {
        io.to(`order_${id}`).emit('ORDER_STATUS_UPDATE', {
          orderId: parseInt(id),
          status,
        });
      }

      return sendResponse(res, 200, true, 'Order status updated successfully', { status });
    } catch (error) {
      console.error('Update Order Status Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      if (error.message.startsWith('VALIDATION')) {
        return sendResponse(res, 400, false, error.message.replace('VALIDATION: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to update order status', { error: error.message });
    }
  }

  /**
   * Cancel order
   * POST /api/orders/:id/cancel
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const actor = req.user;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid order ID');
      }

      if (!reason || typeof reason !== 'string') {
        return sendResponse(res, 400, false, 'Cancellation reason is required');
      }

      const result = await orderService.cancelOrder(parseInt(id), actor, reason);

      // Emit socket event
      const io = req.app.get('io');
      if (io && typeof io.to === 'function') {
        io.to(`order_${id}`).emit('ORDER_CANCELLED', {
          orderId: parseInt(id),
          reason,
        });
      }

      return sendResponse(res, 200, true, 'Order cancelled successfully', { order: result });
    } catch (error) {
      console.error('Cancel Order Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('VALIDATION')) {
        return sendResponse(res, 400, false, error.message.replace('VALIDATION: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to cancel order', { error: error.message });
    }
  }
}

export default new OrderController();
