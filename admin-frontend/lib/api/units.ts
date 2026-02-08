import api from './axios';

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitPayload {
  name: string;
  abbreviation: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateUnitPayload {
  name?: string;
  abbreviation?: string;
  description?: string;
  isActive?: boolean;
}

// List all units (with optional filters)
export const listUnits = async (filters?: {
  isActive?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  
  const response = await api.get(`/admin/units?${params.toString()}`);
  // Backend returns {success, message, data: {units: [...], count: ...}}
  return response.data.data;
};

// Get single unit by ID
export const getUnitById = async (id: number) => {
  const response = await api.get(`/admin/units/${id}`);
  // Backend returns {success, message, data: {unit: {...}}}
  return response.data.data.unit;
};

// Create new unit
export const createUnit = async (payload: CreateUnitPayload) => {
  const response = await api.post('/admin/units', payload);
  return response.data.data;
};

// Update unit
export const updateUnit = async (id: number, payload: UpdateUnitPayload) => {
  const response = await api.put(`/admin/units/${id}`, payload);
  return response.data.data;
};

// Delete unit
export const deleteUnit = async (id: number) => {
  const response = await api.delete(`/admin/units/${id}`);
  return response.data;
};
