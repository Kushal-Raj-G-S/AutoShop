import activityLogService from './activity.service.js';

class ActivityLogController {
  /**
   * List activity logs with filters
   */
  async listActivityLogs(req, res) {
    try {
      const { userId, action, entity, startDate, endDate, page, limit } = req.query;

      const filters = {
        userId,
        action,
        entity,
        startDate,
        endDate,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      };

      const result = await activityLogService.listActivityLogs(filters);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('List Activity Logs Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch activity logs',
      });
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await activityLogService.getActivityStats({
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Activity Stats Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch activity statistics',
      });
    }
  }

  /**
   * Cleanup old logs (admin only)
   */
  async cleanupOldLogs(req, res) {
    try {
      const { daysToKeep = 90 } = req.body;

      const result = await activityLogService.cleanupOldLogs(parseInt(daysToKeep));

      res.status(200).json({
        success: true,
        message: `Deleted ${result.deleted} old activity logs`,
        data: result,
      });
    } catch (error) {
      console.error('Cleanup Logs Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cleanup old logs',
      });
    }
  }
}

export default new ActivityLogController();
