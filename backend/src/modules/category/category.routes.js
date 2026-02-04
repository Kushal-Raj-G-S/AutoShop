import express from 'express';
import categoryController from './category.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/categories', categoryController.listCategoriesPublic);

// Admin routes
router.post('/admin/categories', verifyToken, requireRole('admin'), categoryController.createCategory);
router.get('/admin/categories', verifyToken, requireRole('admin'), categoryController.listCategoriesAdmin);
router.put('/admin/categories/:id', verifyToken, requireRole('admin'), categoryController.updateCategory);
router.delete('/admin/categories/:id', verifyToken, requireRole('admin'), categoryController.deleteCategory);

export default router;
