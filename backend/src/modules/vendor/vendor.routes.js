import express from 'express';
import vendorController from './vendor.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes (Vendor)
router.post('/register', verifyToken, vendorController.registerVendor);
router.get('/me', verifyToken, vendorController.getMyVendorProfile);
router.put('/update', verifyToken, vendorController.updateVendor);

// Admin routes
router.get('/admin/vendors', verifyToken, requireRole('admin'), vendorController.listVendorsForAdmin);
router.get('/admin/vendors/:id', verifyToken, requireRole('admin'), vendorController.getVendorById);
router.post('/admin/vendors', verifyToken, requireRole('admin'), vendorController.createVendorByAdmin);
router.put('/admin/vendors/:id', verifyToken, requireRole('admin'), vendorController.updateVendorByAdmin);
router.delete('/admin/vendors/:id', verifyToken, requireRole('admin'), vendorController.deleteVendor);
router.patch('/admin/vendors/:id/approve', verifyToken, requireRole('admin'), vendorController.approveVendor);
router.patch('/admin/vendors/:id/reject', verifyToken, requireRole('admin'), vendorController.rejectVendor);
router.patch('/admin/vendors/:id/block', verifyToken, requireRole('admin'), vendorController.blockVendor);

export default router;
