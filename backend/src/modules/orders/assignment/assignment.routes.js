/**
 * ORDER ASSIGNMENT ENGINE - ROUTES
 */

import express from 'express';
import assignmentController from './assignment.controller.js';
import { verifyToken, requireRole } from '../../../middleware/auth.middleware.js';

const router = express.Router();

// Vendor routes
router.post(
  '/vendor/orders/:orderId/accept',
  verifyToken,
  requireRole('vendor'),
  assignmentController.acceptOrder
);

router.post(
  '/vendor/orders/:orderId/reject',
  verifyToken,
  requireRole('vendor'),
  assignmentController.rejectOrder
);

// Admin routes
router.post(
  '/admin/orders/:orderId/force-assign',
  verifyToken,
  requireRole('admin'),
  assignmentController.forceAssign
);

router.post(
  '/admin/orders/:orderId/start-assignment',
  verifyToken,
  requireRole('admin'),
  assignmentController.startAssignment
);

router.get(
  '/admin/orders/:orderId/assignments',
  verifyToken,
  requireRole('admin'),
  assignmentController.getAssignmentHistory
);

export default router;
