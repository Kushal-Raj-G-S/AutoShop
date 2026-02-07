import unitService from './unit.service.js';
import { sendResponse } from '../../utils/response.js';

class UnitController {
  // Create unit (Admin only)
  async createUnit(req, res) {
    try {
      const { name, abbreviation, description, isActive } = req.body;

      // Validation
      if (!name || name.trim().length === 0) {
        return sendResponse(res, 400, false, 'Unit name is required');
      }

      if (!abbreviation || abbreviation.trim().length === 0) {
        return sendResponse(res, 400, false, 'Unit abbreviation is required');
      }

      if (name.length > 50) {
        return sendResponse(res, 400, false, 'Unit name cannot exceed 50 characters');
      }

      if (abbreviation.length > 20) {
        return sendResponse(res, 400, false, 'Unit abbreviation cannot exceed 20 characters');
      }

      const result = await unitService.createUnit({
        name: name.trim(),
        abbreviation: abbreviation.trim(),
        description: description?.trim(),
        isActive: isActive !== undefined ? isActive : true,
      });

      return sendResponse(res, 201, true, result.message, { unit: result.unit });
    } catch (error) {
      console.error('Create Unit Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to create unit');
    }
  }

  // Update unit (Admin only)
  async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const { name, abbreviation, description, isActive } = req.body;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid unit ID is required');
      }

      if (name !== undefined && name.trim().length === 0) {
        return sendResponse(res, 400, false, 'Unit name cannot be empty');
      }

      if (abbreviation !== undefined && abbreviation.trim().length === 0) {
        return sendResponse(res, 400, false, 'Unit abbreviation cannot be empty');
      }

      if (name !== undefined && name.length > 50) {
        return sendResponse(res, 400, false, 'Unit name cannot exceed 50 characters');
      }

      if (abbreviation !== undefined && abbreviation.length > 20) {
        return sendResponse(res, 400, false, 'Unit abbreviation cannot exceed 20 characters');
      }

      const result = await unitService.updateUnit(parseInt(id), {
        name: name?.trim(),
        abbreviation: abbreviation?.trim(),
        description: description?.trim(),
        isActive,
      });

      return sendResponse(res, 200, true, result.message, { unit: result.unit });
    } catch (error) {
      console.error('Update Unit Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to update unit');
    }
  }

  // Delete unit (Admin only)
  async deleteUnit(req, res) {
    try {
      const { id } = req.params;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid unit ID is required');
      }

      const result = await unitService.deleteUnit(parseInt(id));

      return sendResponse(res, 200, true, result.message);
    } catch (error) {
      console.error('Delete Unit Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to delete unit');
    }
  }

  // Get unit by ID
  async getUnitById(req, res) {
    try {
      const { id } = req.params;

      // Validation
      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid unit ID is required');
      }

      const unit = await unitService.getUnitById(parseInt(id));

      return sendResponse(res, 200, true, 'Unit fetched successfully', {
        unit,
      });
    } catch (error) {
      console.error('Get Unit Error:', error);
      return sendResponse(res, 404, false, error.message || 'Unit not found');
    }
  }

  // List all units
  async listUnits(req, res) {
    try {
      const { isActive } = req.query;

      const filters = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const units = await unitService.listUnits(filters);

      return sendResponse(res, 200, true, 'Units fetched successfully', {
        units,
        count: units.length,
      });
    } catch (error) {
      console.error('List Units Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch units');
    }
  }
}

export default new UnitController();
