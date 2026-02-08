import axiosInstance from './axios';

export const activityLogsApi = {
  list: async (params?: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/admin/activity-logs', { params });
    return {
      logs: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getStats: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await axiosInstance.get('/admin/activity-logs/stats', { params });
    return response.data.data;
  },

  cleanup: async (daysToKeep: number = 90) => {
    const response = await axiosInstance.post('/admin/activity-logs/cleanup', { daysToKeep });
    return response.data;
  },
};
