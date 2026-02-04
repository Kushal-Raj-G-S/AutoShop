import express from 'express';
import orderController from './order.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Customer routes
router.post('/orders', verifyToken, orderController.createOrder);
router.post('/orders/verify-payment', verifyToken, orderController.verifyPayment);
router.get('/orders/:id', verifyToken, orderController.getOrder);
router.get('/orders', verifyToken, orderController.listOrders);
router.post('/orders/:id/cancel', verifyToken, orderController.cancelOrder);

// Vendor routes (HTTP fallback for socket operations)
router.post('/vendor/orders/:id/accept', verifyToken, requireRole('vendor'), orderController.vendorAcceptOrder);
router.post('/vendor/orders/:id/reject', verifyToken, requireRole('vendor'), orderController.vendorRejectOrder);
router.patch('/vendor/orders/:id/status', verifyToken, requireRole('vendor'), orderController.updateOrderStatus);

export default router;
