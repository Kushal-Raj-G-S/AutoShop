import api from './axios';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  role: 'customer' | 'vendor' | 'admin';
  isActive: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: any; // Vendor details if role is vendor
}

export interface UserStats {
  total: number;
  customers: number;
  vendors: number;
  admins: number;
  blocked: number;
  active: number;
}

// List all users with filters
export const listUsers = async (filters?: {
  role?: string;
  isBlocked?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.isBlocked !== undefined) params.append('isBlocked', filters.isBlocked.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());
  
  const response = await api.get(`/admin/users?${params.toString()}`);
  return response.data.data;
};

// Get single user by ID
export const getUserById = async (id: string) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data.data.user;
};

// Block user
export const blockUser = async (id: string) => {
  const response = await api.patch(`/admin/users/${id}/block`);
  return response.data;
};

// Unblock user
export const unblockUser = async (id: string) => {
  const response = await api.patch(`/admin/users/${id}/unblock`);
  return response.data;
};

// Get user statistics
export const getUserStats = async () => {
  const response = await api.get(`/admin/users/stats`);
  return response.data.data.stats;
};
