import api from './axios';

export interface SubCategory {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubCategoryPayload {
  categoryId: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSubCategoryPayload {
  categoryId?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// List all sub-categories (with optional filters)
export const listSubCategories = async (filters?: {
  categoryId?: number;
  isActive?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  
  const response = await api.get(`/admin/subcategories?${params.toString()}`);
  // Backend returns {success, message, data: {subCategories: [...], count: ...}}
  return response.data.data;
};

// Get single sub-category by ID
export const getSubCategoryById = async (id: number) => {
  const response = await api.get(`/admin/subcategories/${id}`);
  // Backend returns {success, message, data: {subCategory: {...}}}
  return response.data.data.subCategory;
};

// Create new sub-category
export const createSubCategory = async (payload: CreateSubCategoryPayload) => {
  const response = await api.post('/admin/subcategories', payload);
  return response.data.data;
};

// Update sub-category
export const updateSubCategory = async (id: number, payload: UpdateSubCategoryPayload) => {
  const response = await api.put(`/admin/subcategories/${id}`, payload);
  return response.data.data;
};

// Delete sub-category
export const deleteSubCategory = async (id: number) => {
  const response = await api.delete(`/admin/subcategories/${id}`);
  return response.data;
};
