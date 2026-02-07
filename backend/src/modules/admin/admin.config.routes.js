import { Router } from 'express';
import adminConfigController from './admin.config.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/admin/config
 * @desc    Get all system configuration settings
 * @access  Admin only
 */
router.get('/config', verifyToken, adminConfigController.getAllConfig.bind(adminConfigController));

/**
 * @route   PUT /api/admin/config
 * @desc    Update system configuration settings
 * @access  Admin only
 */
router.put('/config', verifyToken, adminConfigController.updateConfig.bind(adminConfigController));

export default router;
