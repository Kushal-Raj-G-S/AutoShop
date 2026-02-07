import axiosInstance from './axios';

export interface ConfigItem {
  key: string;
  value: any;
  description: string;
  dataType: string;
}

export interface ConfigGroup {
  assignment: ConfigItem[];
  pricing: ConfigItem[];
  order: ConfigItem[];
}

export const getSystemConfig = async (): Promise<{ config: ConfigGroup }> => {
  const response = await axiosInstance.get('/admin/config');
  return response.data.data;
};

export const updateSystemConfig = async (updates: Array<{ key: string; value: any }>) => {
  const response = await axiosInstance.put('/admin/config', { updates });
  return response.data.data;
};
