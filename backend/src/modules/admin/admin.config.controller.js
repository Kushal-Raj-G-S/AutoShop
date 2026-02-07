import adminConfigService from './admin.config.service.js';
import { sendResponse } from '../../utils/response.js';

class AdminConfigController {
  /**
   * GET /api/admin/config
   * Get all configuration settings grouped by category
   */
  async getAllConfig(req, res) {
    try {
      const config = await adminConfigService.getAllConfig();
      return sendResponse(res, 200, true, 'Configuration fetched successfully', { config });
    } catch (error) {
      console.error('Get Config Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch configuration');
    }
  }

  /**
   * PUT /api/admin/config
   * Update configuration settings
   */
  async updateConfig(req, res) {
    try {
      const { updates } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return sendResponse(res, 400, false, 'Updates array is required');
      }

      // Validate each update has key and value
      for (const update of updates) {
        if (!update.key || update.value === undefined) {
          return sendResponse(res, 400, false, 'Each update must have key and value');
        }
      }

      const updatedBy = req.user?.id || null;
      const results = await adminConfigService.updateConfig(updates, updatedBy);

      return sendResponse(res, 200, true, 'Configuration updated successfully', { results });
    } catch (error) {
      console.error('Update Config Error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return sendResponse(res, statusCode, false, error.message || 'Failed to update configuration');
    }
  }
}

export default new AdminConfigController();
