import itemService from './item.service.js';
import { sendResponse } from '../../utils/response.js';

class ItemController {
  /**
   * Create new item (Admin only)
   * POST /api/admin/items
   */
  async createItem(req, res) {
    try {
      const actor = req.user;
      const { 
        categoryId, 
        name, 
        sku,
        brand,
        subCategory,
        description, 
        price, 
        tax,
        serviceTime,
        unitType,
        imageUrl, 
        stock, 
        metadata 
      } = req.body;

      // Validation
      const errors = [];

      if (!categoryId || isNaN(parseInt(categoryId))) {
        errors.push('categoryId must be a valid integer');
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('name is required and must be a non-empty string');
      }

      if (name && name.length > 120) {
        errors.push('name must be at most 120 characters');
      }

      if (!price || isNaN(parseFloat(price))) {
        errors.push('price is required and must be a number');
      }

      if (price && parseFloat(price) < 0) {
        errors.push('price must be non-negative');
      }

      if (tax !== undefined && (isNaN(parseFloat(tax)) || parseFloat(tax) < 0 || parseFloat(tax) > 100)) {
        errors.push('tax must be between 0 and 100');
      }

      if (serviceTime !== undefined && (isNaN(parseInt(serviceTime)) || parseInt(serviceTime) < 0)) {
        errors.push('serviceTime must be a non-negative integer');
      }

      if (imageUrl && typeof imageUrl !== 'string') {
        errors.push('imageUrl must be a string');
      }

      if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
        errors.push('stock must be a non-negative integer');
      }

      if (metadata !== undefined && typeof metadata !== 'object') {
        errors.push('metadata must be a valid JSON object');
      }

      if (errors.length > 0) {
        return sendResponse(res, 400, false, 'Validation failed', { errors });
      }

      const item = await itemService.createItem(
        {
          categoryId: parseInt(categoryId),
          name: name.trim(),
          sku: sku?.trim(),
          brand: brand?.trim(),
          subCategory: subCategory?.trim(),
          description: description?.trim(),
          price: parseFloat(price),
          tax: tax !== undefined ? parseFloat(tax) : 0,
          serviceTime: serviceTime !== undefined ? parseInt(serviceTime) : 0,
          unitType: unitType || 'pcs',
          imageUrl,
          stock: stock !== undefined ? parseInt(stock) : 0,
          metadata,
        },
        actor
      );

      return sendResponse(res, 201, true, 'Item created successfully', { item });
    } catch (error) {
      console.error('Create Item Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      if (error.message.startsWith('VALIDATION')) {
        return sendResponse(res, 400, false, error.message.replace('VALIDATION: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to create item', { error: error.message });
    }
  }

  /**
   * List items for admin
   * GET /api/admin/items
   */
  async listItemsAdmin(req, res) {
    try {
      const { page, limit, q } = req.query;

      const result = await itemService.listItemsAdmin({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        q,
      });

      return sendResponse(res, 200, true, 'Items fetched successfully', result);
    } catch (error) {
      console.error('List Items Admin Error:', error);
      return sendResponse(res, 500, false, 'Failed to fetch items', { error: error.message });
    }
  }

  /**
   * Update item (Admin only)
   * PUT /api/admin/items/:id
   */
  async updateItem(req, res) {
    try {
      const actor = req.user;
      const { id } = req.params;
      const { 
        categoryId, 
        name, 
        sku,
        brand,
        subCategory,
        description, 
        price, 
        tax,
        serviceTime,
        unitType,
        imageUrl, 
        stock, 
        isActive, 
        metadata 
      } = req.body;

      // Validation
      const errors = [];

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid item ID');
      }

      if (categoryId !== undefined && isNaN(parseInt(categoryId))) {
        errors.push('categoryId must be a valid integer');
      }

      if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
        errors.push('name must be a non-empty string');
      }

      if (name && name.length > 120) {
        errors.push('name must be at most 120 characters');
      }

      if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
        errors.push('price must be a non-negative number');
      }

      if (tax !== undefined && (isNaN(parseFloat(tax)) || parseFloat(tax) < 0 || parseFloat(tax) > 100)) {
        errors.push('tax must be between 0 and 100');
      }

      if (serviceTime !== undefined && (isNaN(parseInt(serviceTime)) || parseInt(serviceTime) < 0)) {
        errors.push('serviceTime must be a non-negative integer');
      }

      if (imageUrl !== undefined && typeof imageUrl !== 'string') {
        errors.push('imageUrl must be a string');
      }

      if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
        errors.push('stock must be a non-negative integer');
      }

      if (isActive !== undefined && typeof isActive !== 'boolean') {
        errors.push('isActive must be a boolean');
      }

      if (metadata !== undefined && typeof metadata !== 'object') {
        errors.push('metadata must be a valid JSON object');
      }

      if (errors.length > 0) {
        return sendResponse(res, 400, false, 'Validation failed', { errors });
      }

      const payload = {};
      if (categoryId !== undefined) payload.categoryId = parseInt(categoryId);
      if (name !== undefined) payload.name = name.trim();
      if (sku !== undefined) payload.sku = sku?.trim();
      if (brand !== undefined) payload.brand = brand?.trim();
      if (subCategory !== undefined) payload.subCategory = subCategory?.trim();
      if (description !== undefined) payload.description = description?.trim();
      if (price !== undefined) payload.price = parseFloat(price);
      if (tax !== undefined) payload.tax = parseFloat(tax);
      if (serviceTime !== undefined) payload.serviceTime = parseInt(serviceTime);
      if (unitType !== undefined) payload.unitType = unitType;
      if (imageUrl !== undefined) payload.imageUrl = imageUrl;
      if (stock !== undefined) payload.stock = parseInt(stock);
      if (isActive !== undefined) payload.isActive = isActive;
      if (metadata !== undefined) payload.metadata = metadata;

      const item = await itemService.updateItem(parseInt(id), payload, actor);

      return sendResponse(res, 200, true, 'Item updated successfully', { item });
    } catch (error) {
      console.error('Update Item Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('VALIDATION')) {
        return sendResponse(res, 400, false, error.message.replace('VALIDATION: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to update item', { error: error.message });
    }
  }

  /**
   * Delete item (Admin only)
   * DELETE /api/admin/items/:id
   */
  async deleteItem(req, res) {
    try {
      const actor = req.user;
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid item ID');
      }

      await itemService.deleteItem(parseInt(id), actor);

      return sendResponse(res, 200, true, 'Item deleted successfully');
    } catch (error) {
      console.error('Delete Item Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      if (error.message.startsWith('CONFLICT')) {
        return sendResponse(res, 409, false, error.message.replace('CONFLICT: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to delete item', { error: error.message });
    }
  }

  /**
   * Retire an item (Admin only) - safer alternative to deletion
   * PUT /api/admin/items/:id/retire
   */
  async retireItem(req, res) {
    try {
      const actor = req.user;
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid item ID');
      }

      const item = await itemService.retireItem(parseInt(id), actor);

      return sendResponse(res, 200, true, 'Item retired successfully', { item });
    } catch (error) {
      console.error('Retire Item Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to retire item', { error: error.message });
    }
  }

  /**
   * Get item by ID (Public)
   * GET /api/items/:id
   */
  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const actor = req.user; // May be undefined for public access

      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Invalid item ID');
      }

      const item = await itemService.getItemById(parseInt(id), actor);

      return sendResponse(res, 200, true, 'Item fetched successfully', { item });
    } catch (error) {
      console.error('Get Item Error:', error);

      if (error.message.startsWith('NOT_FOUND')) {
        return sendResponse(res, 404, false, error.message.replace('NOT_FOUND: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to fetch item', { error: error.message });
    }
  }

  /**
   * List items (Public with filters)
   * GET /api/items
   */
  async listItemsPublic(req, res) {
    try {
      const { page, limit, q, categoryId, minPrice, maxPrice, sort } = req.query;

      const result = await itemService.listItemsPublic({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        q,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sort,
      });

      return sendResponse(res, 200, true, 'Items fetched successfully', result);
    } catch (error) {
      console.error('List Items Public Error:', error);
      return sendResponse(res, 500, false, 'Failed to fetch items', { error: error.message });
    }
  }

  /**
   * Bulk upload items from CSV (Admin only)
   * POST /api/admin/items/bulk-upload
   */
  async bulkUploadItems(req, res) {
    try {
      const actor = req.user;
      const { items: itemsData } = req.body;

      if (!Array.isArray(itemsData) || itemsData.length === 0) {
        return sendResponse(res, 400, false, 'Items data must be a non-empty array');
      }

      const results = await itemService.bulkCreateItems(itemsData, actor);

      return sendResponse(res, 200, true, 'Bulk upload completed', { results });
    } catch (error) {
      console.error('Bulk Upload Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to bulk upload items', { error: error.message });
    }
  }

  /**
   * Bulk update items (Admin only)
   * PUT /api/admin/items/bulk-update
   */
  async bulkUpdateItems(req, res) {
    try {
      console.log('🔄 Bulk Update Request:', req.body);
      const actor = req.user;
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return sendResponse(res, 400, false, 'Updates must be a non-empty array');
      }

      const results = await itemService.bulkUpdateItems(updates, actor);
      console.log('✅ Bulk Update Results:', results);

      return sendResponse(res, 200, true, 'Bulk update completed', { results });
    } catch (error) {
      console.error('Bulk Update Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to bulk update items', { error: error.message });
    }
  }

  /**
   * Bulk delete items (Admin only)
   * DELETE /api/admin/items/bulk-delete
   */
  async bulkDeleteItems(req, res) {
    try {
      console.log('🗑 Bulk Delete Request:', req.body);
      const actor = req.user;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return sendResponse(res, 400, false, 'IDs must be a non-empty array');
      }

      const results = await itemService.bulkDeleteItems(ids, actor);
      console.log('✅ Bulk Delete Results:', results);

      return sendResponse(res, 200, true, 'Bulk delete completed', { results });
    } catch (error) {
      console.error('Bulk Delete Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to bulk delete items', { error: error.message });
    }
  }

  /**
   * Check which items can be deleted (Admin only)
   * POST /api/admin/items/check-deletable
   */
  async checkDeletableItems(req, res) {
    try {
      const actor = req.user;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return sendResponse(res, 400, false, 'IDs must be a non-empty array');
      }

      const results = await itemService.checkDeletableItems(ids, actor);

      return sendResponse(res, 200, true, 'Check completed', { results });
    } catch (error) {
      console.error('Check Deletable Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to check items', { error: error.message });
    }
  }

  /**
   * Bulk retire items (Admin only) - safer alternative to bulk deletion
   * PUT /api/admin/items/bulk-retire
   */
  async bulkRetireItems(req, res) {
    try {
      console.log('⏸ Bulk Retire Request:', req.body);
      const actor = req.user;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return sendResponse(res, 400, false, 'IDs must be a non-empty array');
      }

      const results = await itemService.bulkRetireItems(ids, actor);
      console.log('✅ Bulk Retire Results:', results);

      return sendResponse(res, 200, true, 'Bulk retire completed', { results });
    } catch (error) {
      console.error('Bulk Retire Error:', error);

      if (error.message.startsWith('FORBIDDEN')) {
        return sendResponse(res, 403, false, error.message.replace('FORBIDDEN: ', ''));
      }

      return sendResponse(res, 500, false, 'Failed to bulk retire items', { error: error.message });
    }
  }
}

export default new ItemController();
