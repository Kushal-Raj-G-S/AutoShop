import express from 'express';
import itemController from './item.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/items', itemController.listItemsPublic);
router.get('/items/:id', itemController.getItemById);

// Admin routes
// IMPORTANT: Bulk routes MUST come before :id routes to avoid route conflicts
router.post('/admin/items/bulk-upload', verifyToken, requireRole('admin'), itemController.bulkUploadItems);
router.put('/admin/items/bulk-update', verifyToken, requireRole('admin'), itemController.bulkUpdateItems);
router.delete('/admin/items/bulk-delete', verifyToken, requireRole('admin'), itemController.bulkDeleteItems);
router.post('/admin/items/check-deletable', verifyToken, requireRole('admin'), itemController.checkDeletableItems);
router.put('/admin/items/bulk-retire', verifyToken, requireRole('admin'), itemController.bulkRetireItems);

router.post('/admin/items', verifyToken, requireRole('admin'), itemController.createItem);
router.get('/admin/items', verifyToken, requireRole('admin'), itemController.listItemsAdmin);
router.get('/admin/items/:id', verifyToken, requireRole('admin'), itemController.getItemById);
router.put('/admin/items/:id', verifyToken, requireRole('admin'), itemController.updateItem);
router.delete('/admin/items/:id', verifyToken, requireRole('admin'), itemController.deleteItem);
router.put('/admin/items/:id/retire', verifyToken, requireRole('admin'), itemController.retireItem);

export default router;
