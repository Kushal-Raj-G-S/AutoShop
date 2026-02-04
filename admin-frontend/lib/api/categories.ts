import axiosInstance from "./axios";

export interface Category {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

// Admin endpoints
export const getAdminCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get("/admin/categories");
  // Backend returns {success, message, data: {categories: [...]}}
  return response.data.data.categories;
};

export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await axiosInstance.get(`/admin/categories/${id}`);
  // Backend returns {success, message, data: {category: {...}}}
  return response.data.data.category;
};

export const createCategory = async (data: CategoryInput): Promise<Category> => {
  const response = await axiosInstance.post("/admin/categories", data);
  // Backend returns {success, message, data: {category: {...}}}
  return response.data.data.category;
};

export const updateCategory = async (id: number, data: CategoryInput): Promise<Category> => {
  const response = await axiosInstance.put(`/admin/categories/${id}`, data);
  // Backend returns {success, message, data: {category: {...}}}
  return response.data.data.category;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/admin/categories/${id}`);
};

// Public endpoint
export const getPublicCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get("/categories");
  // Backend returns {success, message, data: {categories: [...]}}
  return response.data.data.categories;
};
