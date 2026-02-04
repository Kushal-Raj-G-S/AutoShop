import { Router } from 'express';
import adminStatsController from './admin.stats.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = Router();

// All admin stats routes require authentication and admin role
// Role validation should be added in middleware

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/stats', verifyToken, adminStatsController.getDashboardStats.bind(adminStatsController));

export default router;
