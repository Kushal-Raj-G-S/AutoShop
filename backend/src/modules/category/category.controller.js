import categoryService from './category.service.js';
import { sendResponse } from '../../utils/response.js';

class CategoryController {
  // Create category (Admin only)
  async createCategory(req, res) {
    try {
      const { name, description, imageUrl } = req.body;

      // Validation
      if (!name || !imageUrl) {
        return sendResponse(res, 400, false, 'Name and imageUrl are required');
      }

      if (name.trim().length === 0) {
        return sendResponse(res, 400, false, 'Category name cannot be empty');
      }

      if (name.length > 80) {
        return sendResponse(res, 400, false, 'Category name cannot exceed 80 characters');
      }

      const result = await categoryService.createCategory({
        name: name.trim(),
        description: description?.trim(),
        imageUrl: imageUrl.trim(),
      });

      return sendResponse(res, 201, true, result.message, { category: result.category });
    } catch (error) {
      console.error('Create Category Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to create category');
    }
  }

  // Update category (Admin only)
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, imageUrl } = req.body;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid category ID is required');
      }

      if (name !== undefined && name.trim().length === 0) {
        return sendResponse(res, 400, false, 'Category name cannot be empty');
      }

      if (name !== undefined && name.length > 80) {
        return sendResponse(res, 400, false, 'Category name cannot exceed 80 characters');
      }

      const result = await categoryService.updateCategory(parseInt(id), {
        name: name?.trim(),
        description: description?.trim(),
        imageUrl: imageUrl?.trim(),
      });

      return sendResponse(res, 200, true, result.message, { category: result.category });
    } catch (error) {
      console.error('Update Category Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to update category');
    }
  }

  // Delete category (Admin only)
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid category ID is required');
      }

      const result = await categoryService.deleteCategory(parseInt(id));

      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      console.error('Delete Category Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to delete category');
    }
  }

  // List all categories (Admin)
  async listCategoriesAdmin(req, res) {
    try {
      const categories = await categoryService.listCategoriesAdmin();

      return sendResponse(res, 200, true, 'Categories fetched successfully', {
        categories,
        count: categories.length,
      });
    } catch (error) {
      console.error('List Categories Admin Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch categories');
    }
  }

  // List all categories (Public)
  async listCategoriesPublic(req, res) {
    try {
      const categories = await categoryService.listCategoriesPublic();

      return sendResponse(res, 200, true, 'Categories fetched successfully', {
        categories,
        count: categories.length,
      });
    } catch (error) {
      console.error('List Categories Public Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch categories');
    }
  }
}

export default new CategoryController();
