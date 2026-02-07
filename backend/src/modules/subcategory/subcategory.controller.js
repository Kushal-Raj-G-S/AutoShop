import subCategoryService from './subcategory.service.js';
import { sendResponse } from '../../utils/response.js';

class SubCategoryController {
  // Create sub-category (Admin only)
  async createSubCategory(req, res) {
    try {
      const { categoryId, name, description, isActive } = req.body;

      // Validation
      if (!categoryId || isNaN(categoryId)) {
        return sendResponse(res, 400, false, 'Valid category ID is required');
      }

      if (!name || name.trim().length === 0) {
        return sendResponse(res, 400, false, 'Sub-category name is required');
      }

      if (name.length > 100) {
        return sendResponse(res, 400, false, 'Sub-category name cannot exceed 100 characters');
      }

      const result = await subCategoryService.createSubCategory({
        categoryId: parseInt(categoryId),
        name: name.trim(),
        description: description?.trim(),
        isActive: isActive !== undefined ? isActive : true,
      });

      return sendResponse(res, 201, true, result.message, { subCategory: result.subCategory });
    } catch (error) {
      console.error('Create Sub-Category Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to create sub-category');
    }
  }

  // Update sub-category (Admin only)
  async updateSubCategory(req, res) {
    try {
      const { id } = req.params;
      const { categoryId, name, description, isActive } = req.body;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid sub-category ID is required');
      }

      if (categoryId !== undefined && isNaN(categoryId)) {
        return sendResponse(res, 400, false, 'Valid category ID is required');
      }

      if (name !== undefined && name.trim().length === 0) {
        return sendResponse(res, 400, false, 'Sub-category name cannot be empty');
      }

      if (name !== undefined && name.length > 100) {
        return sendResponse(res, 400, false, 'Sub-category name cannot exceed 100 characters');
      }

      const result = await subCategoryService.updateSubCategory(parseInt(id), {
        categoryId: categoryId ?parseInt(categoryId) : undefined,
        name: name?.trim(),
        description: description?.trim(),
        isActive,
      });

      return sendResponse(res, 200, true, result.message, { subCategory: result.subCategory });
    } catch (error) {
      console.error('Update Sub-Category Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to update sub-category');
    }
  }

  // Delete sub-category (Admin only)
  async deleteSubCategory(req, res) {
    try {
      const { id } = req.params;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid sub-category ID is required');
      }

      const result = await subCategoryService.deleteSubCategory(parseInt(id));

      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      console.error('Delete Sub-Category Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to delete sub-category');
    }
  }

  // Get sub-category by ID
  async getSubCategoryById(req, res) {
    try {
      const { id } = req.params;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid sub-category ID is required');
      }

      const subCategory = await subCategoryService.getSubCategoryById(parseInt(id));

      return sendResponse(res, 200, true, 'Sub-category fetched successfully', {
        subCategory,
      });
    } catch (error) {
      console.error('Get Sub-Category Error:', error);
      return sendResponse(res, 404, false, error.message || 'Sub-category not found');
    }
  }

  // List all sub-categories
  async listSubCategories(req, res) {
    try {
      const { categoryId, isActive } = req.query;

      const filters = {};
      if (categoryId) filters.categoryId = parseInt(categoryId);
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const subCategories = await subCategoryService.listSubCategories(filters);

      return sendResponse(res, 200, true, 'Sub-categories fetched successfully', {
        subCategories,
        count: subCategories.length,
      });
    } catch (error) {
      console.error('List Sub-Categories Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch sub-categories');
    }
  }
}

export default new SubCategoryController();
