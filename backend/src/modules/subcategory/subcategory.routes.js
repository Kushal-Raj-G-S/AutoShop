import express from 'express';
import subCategoryController from './subcategory.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/subcategories', subCategoryController.listSubCategories);
router.get('/subcategories/:id', subCategoryController.getSubCategoryById);

// Admin routes
router.post('/admin/subcategories', verifyToken, requireRole('admin'), subCategoryController.createSubCategory);
router.get('/admin/subcategories', verifyToken, requireRole('admin'), subCategoryController.listSubCategories);
router.get('/admin/subcategories/:id', verifyToken, requireRole('admin'), subCategoryController.getSubCategoryById);
router.put('/admin/subcategories/:id', verifyToken, requireRole('admin'), subCategoryController.updateSubCategory);
router.delete('/admin/subcategories/:id', verifyToken, requireRole('admin'), subCategoryController.deleteSubCategory);

export default router;
