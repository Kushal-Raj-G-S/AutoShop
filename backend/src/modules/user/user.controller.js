import userService from './user.service.js';
import { sendResponse } from '../../utils/response.js';

class UserController {
  // List all users (Admin only)
  async listUsers(req, res) {
    try {
      const { role, isBlocked, search, limit, offset } = req.query;

      const filters = {};
      if (role) filters.role = role;
      if (isBlocked !== undefined) filters.isBlocked = isBlocked === 'true';
      if (search) filters.search = search;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const result = await userService.listUsers(filters);

      return sendResponse(res, 200, true, 'Users fetched successfully', result);
    } catch (error) {
      console.error('List Users Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch users');
    }
  }

  // Get user by ID (Admin only)
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendResponse(res, 400, false, 'User ID is required');
      }

      const user = await userService.getUserById(id);

      return sendResponse(res, 200, true, 'User fetched successfully', {
        user,
      });
    } catch (error) {
      console.error('Get User Error:', error);
      return sendResponse(res, 404, false, error.message || 'User not found');
    }
  }

  // Block user (Admin only)
  async blockUser(req, res) {
    try {
      const { id } = req.params;
      const blockedBy = req.user.id; // Admin user ID from JWT

      if (!id) {
        return sendResponse(res, 400, false, 'User ID is required');
      }

      const result = await userService.blockUser(id, blockedBy);

      return sendResponse(res, 200, true, result.message, {
        user: result.user,
      });
    } catch (error) {
      console.error('Block User Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to block user');
    }
  }

  // Unblock user (Admin only)
  async unblockUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendResponse(res, 400, false, 'User ID is required');
      }

      const result = await userService.unblockUser(id);

      return sendResponse(res, 200, true, result.message, {
        user: result.user,
      });
    } catch (error) {
      console.error('Unblock User Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to unblock user');
    }
  }

  // Get user statistics (Admin only)
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();

      return sendResponse(res, 200, true, 'User statistics fetched successfully', {
        stats,
      });
    } catch (error) {
      console.error('Get User Stats Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch user statistics');
    }
  }
}

export default new UserController();
