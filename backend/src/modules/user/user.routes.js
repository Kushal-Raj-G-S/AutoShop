import express from 'express';
import userController from './user.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes are admin-only
router.get('/admin/users', verifyToken, requireRole('admin'), userController.listUsers);
router.get('/admin/users/stats', verifyToken, requireRole('admin'), userController.getUserStats);
router.get('/admin/users/:id', verifyToken, requireRole('admin'), userController.getUserById);
router.patch('/admin/users/:id/block', verifyToken, requireRole('admin'), userController.blockUser);
router.patch('/admin/users/:id/unblock', verifyToken, requireRole('admin'), userController.unblockUser);

export default router;
