import axiosInstance from './axios';

export const reportsApi = {
  getOrdersReport: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    vendorId?: string;
  }) => {
    const response = await axiosInstance.get('/admin/reports/orders', { params });
    return response.data.data;
  },

  getPayoutsReport: async (params?: {
    startDate?: string;
    endDate?: string;
    vendorId?: string;
    status?: string;
  }) => {
    const response = await axiosInstance.get('/admin/reports/payouts', { params });
    return response.data.data;
  },

  getInventoryReport: async () => {
    const response = await axiosInstance.get('/admin/reports/inventory');
    return response.data.data;
  },

  getVendorReport: async (params?: {
    startDate?: string;
    endDate?: string;
    vendorId?: string;
  }) => {
    const response = await axiosInstance.get('/admin/reports/vendor', { params });
    return response.data.data;
  },

  downloadPDF: async (
    reportType: 'orders' | 'payouts' | 'inventory' | 'vendor',
    params: any = {}
  ): Promise<Blob> => {
    const endpoint = `/admin/reports/${reportType}`;
    const response = await axiosInstance.get(endpoint, {
      params: { ...params, format: 'pdf' },
      responseType: 'blob',
    });
    return response.data;
  },
};
