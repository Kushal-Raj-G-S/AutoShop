import { Router } from 'express';
import reportsController from './reports.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// All reports routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('admin'));

/**
 * @route   GET /api/admin/reports/orders
 * @desc    Get orders report (JSON or PDF)
 * @access  Admin
 * @query   startDate, endDate, status, vendorId, format (json|pdf)
 */
router.get('/orders', reportsController.getOrdersReport);

/**
 * @route   GET /api/admin/reports/payouts
 * @desc    Get payouts report (JSON or PDF)
 * @access  Admin
 * @query   startDate, endDate, vendorId, status, format (json|pdf)
 */
router.get('/payouts', reportsController.getPayoutsReport);

/**
 * @route   GET /api/admin/reports/inventory
 * @desc    Get inventory report (JSON or PDF)
 * @access  Admin
 * @query   format (json|pdf)
 */
router.get('/inventory', reportsController.getInventoryReport);

/**
 * @route   GET /api/admin/reports/vendor
 * @desc    Get vendor performance report (JSON or PDF)
 * @access  Admin
 * @query   startDate, endDate, vendorId, format (json|pdf)
 */
router.get('/vendor', reportsController.getVendorReport);

export default router;
