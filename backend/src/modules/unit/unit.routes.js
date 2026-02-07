import express from 'express';
import unitController from './unit.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/units', unitController.listUnits);
router.get('/units/:id', unitController.getUnitById);

// Admin routes
router.post('/admin/units', verifyToken, requireRole('admin'), unitController.createUnit);
router.get('/admin/units', verifyToken, requireRole('admin'), unitController.listUnits);
router.get('/admin/units/:id', verifyToken, requireRole('admin'), unitController.getUnitById);
router.put('/admin/units/:id', verifyToken, requireRole('admin'), unitController.updateUnit);
router.delete('/admin/units/:id', verifyToken, requireRole('admin'), unitController.deleteUnit);

export default router;
