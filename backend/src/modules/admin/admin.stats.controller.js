import adminStatsService from './admin.stats.service.js';
import { sendResponse } from '../../utils/response.js';

class AdminStatsController {
  /**
   * GET /api/admin/stats
   * Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      const stats = await adminStatsService.getDashboardStats();
      return sendResponse(res, 200, true, 'Dashboard stats fetched successfully', stats);
    } catch (error) {
      console.error('Get Dashboard Stats Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch dashboard stats');
    }
  }
}

export default new AdminStatsController();
