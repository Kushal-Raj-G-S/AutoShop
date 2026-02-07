import { Router } from 'express';
import adminOrdersController from './admin.orders.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = Router();

// All admin orders routes require authentication and admin role
// Role validation should be added in middleware

/**
 * @route   GET /api/admin/orders/recent
 * @desc    Get recent orders (last 10)
 * @access  Admin only
 */
router.get('/orders/recent', verifyToken, adminOrdersController.getRecentOrders.bind(adminOrdersController));

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get order details by ID
 * @access  Admin only
 */
router.get('/orders/:id', verifyToken, adminOrdersController.getOrderById.bind(adminOrdersController));

/**
 * @route   GET /api/admin/orders/:id/nearby-vendors
 * @desc    Get nearby vendors for manual assignment
 * @access  Admin only
 */
router.get('/orders/:id/nearby-vendors', verifyToken, adminOrdersController.getNearbyVendors.bind(adminOrdersController));

/**
 * @route   POST /api/admin/orders/:id/force-assign
 * @desc    Force assign order to a vendor
 * @access  Admin only
 */
router.post('/orders/:id/force-assign', verifyToken, adminOrdersController.forceAssignOrder.bind(adminOrdersController));

/**
 * @route   POST /api/admin/orders/:id/auto-assign
 * @desc    Trigger automatic vendor assignment
 * @access  Admin only
 */
router.post('/orders/:id/auto-assign', verifyToken, adminOrdersController.triggerAutoAssignment.bind(adminOrdersController));

/**
 * @route   POST /api/admin/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Admin only
 */
router.post('/orders/:id/cancel', verifyToken, adminOrdersController.cancelOrder.bind(adminOrdersController));

/**
 * @route   GET /api/admin/orders
 * @desc    Get paginated orders with filtering and search
 * @access  Admin only
 */
router.get('/orders', verifyToken, adminOrdersController.getOrders.bind(adminOrdersController));

export default router;
