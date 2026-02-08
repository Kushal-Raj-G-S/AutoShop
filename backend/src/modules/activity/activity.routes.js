import { Router } from 'express';
import activityLogController from './activity.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// All activity log routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole('admin'));

/**
 * @route   GET /api/admin/activity-logs
 * @desc    Get activity logs with filters
 * @access  Admin
 * @query   userId, action, entity, startDate, endDate, page, limit
 */
router.get('/', activityLogController.listActivityLogs);

/**
 * @route   GET /api/admin/activity-logs/stats
 * @desc    Get activity statistics
 * @access  Admin
 * @query   startDate, endDate
 */
router.get('/stats', activityLogController.getActivityStats);

/**
 * @route   POST /api/admin/activity-logs/cleanup
 * @desc    Cleanup old activity logs
 * @access  Admin
 * @body    daysToKeep (default: 90)
 */
router.post('/cleanup', activityLogController.cleanupOldLogs);

export default router;
