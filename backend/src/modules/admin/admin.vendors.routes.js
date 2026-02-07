import { Router } from 'express';
import adminVendorsController from './admin.vendors.controller.js';
import vendorController from '../vendor/vendor.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// All admin vendors routes require authentication and admin role
// Role validation should be added in middleware

/**
 * @route   GET /api/admin/vendors/:id
 * @desc    Get vendor details by ID
 * @access  Admin only
 */
router.get('/vendors/:id', verifyToken, adminVendorsController.getVendorById.bind(adminVendorsController));

/**
 * @route   GET /api/admin/vendors
 * @desc    Get all vendors with user details
 * @access  Admin only
 */
router.get('/vendors', verifyToken, adminVendorsController.getAllVendors.bind(adminVendorsController));

/**
 * @route   PATCH /api/admin/vendors/:id/approve
 * @desc    Approve vendor
 * @access  Admin only
 */
router.patch('/vendors/:id/approve', verifyToken, requireRole('admin'), vendorController.approveVendor.bind(vendorController));

/**
 * @route   PATCH /api/admin/vendors/:id/reject
 * @desc    Reject vendor
 * @access  Admin only
 */
router.patch('/vendors/:id/reject', verifyToken, requireRole('admin'), vendorController.rejectVendor.bind(vendorController));

/**
 * @route   PATCH /api/admin/vendors/:id/block
 * @desc    Block vendor
 * @access  Admin only
 */
router.patch('/vendors/:id/block', verifyToken, requireRole('admin'), vendorController.blockVendor.bind(vendorController));

/**
 * @route   PATCH /api/admin/vendors/:id/unblock
 * @desc    Unblock vendor
 * @access  Admin only
 */
router.patch('/vendors/:id/unblock', verifyToken, requireRole('admin'), vendorController.unblockVendor.bind(vendorController));

/**
 * @route   POST /api/admin/vendors
 * @desc    Create vendor by admin
 * @access  Admin only
 */
router.post('/vendors', verifyToken, requireRole('admin'), vendorController.createVendorByAdmin.bind(vendorController));

/**
 * @route   PUT /api/admin/vendors/:id
 * @desc    Update vendor by admin
 * @access  Admin only
 */
router.put('/vendors/:id', verifyToken, requireRole('admin'), vendorController.updateVendorByAdmin.bind(vendorController));

/**
 * @route   DELETE /api/admin/vendors/:id
 * @desc    Delete vendor
 * @access  Admin only
 */
router.delete('/vendors/:id', verifyToken, requireRole('admin'), vendorController.deleteVendor.bind(vendorController));

/**
 * @route   PATCH /api/admin/vendors/:id/required-documents
 * @desc    Update vendor required documents
 * @access  Admin only
 */
router.patch('/vendors/:id/required-documents', verifyToken, requireRole('admin'), vendorController.updateRequiredDocuments.bind(vendorController));

/**
 * @route   PATCH /api/admin/vendors/:id/admin-notes
 * @desc    Update vendor admin notes
 * @access  Admin only
 */
router.patch('/vendors/:id/admin-notes', verifyToken, requireRole('admin'), vendorController.updateAdminNotes.bind(vendorController));

export default router;
