import axiosInstance from "./axios";

export interface Item {
  id: number;
  name: string;
  sku?: string;
  brand?: string;
  subCategory?: string;
  description?: string;
  price: number;
  tax?: number;
  serviceTime?: number;
  unitType?: string;
  categoryId: number;
  categoryName?: string;
  imageUrl?: string;
  isActive: boolean;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemFormData {
  name: string;
  sku?: string;
  brand?: string;
  subCategory?: string;
  description?: string;
  price: number;
  tax?: number;
  serviceTime?: number;
  unitType?: string;
  categoryId: number;
  imageUrl?: string;
  isActive?: boolean;
  stock?: number;
}

export const getItems = async (params?: {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}) => {
  const response = await axiosInstance.get("/admin/items", { 
    params: {
      ...params,
      limit: 1000 // Fetch all items (increase if you have more than 1000)
    }
  });
  // Backend returns {success, message, data: {items: [...]}}
  return response.data.data.items;
};

export const getItemById = async (id: string) => {
  const response = await axiosInstance.get(`/admin/items/${id}`);
  // Backend returns {success, message, data: {item: {...}}}
  return response.data.data.item;
};

export const createItem = async (data: ItemFormData) => {
  const response = await axiosInstance.post("/admin/items", data);
  // Backend returns {success, message, data: {item: {...}}}
  return response.data.data.item;
};

export const updateItem = async (id: string, data: ItemFormData) => {
  const response = await axiosInstance.put(`/admin/items/${id}`, data);
  // Backend returns {success, message, data: {item: {...}}}
  return response.data.data.item;
};

export const deleteItem = async (id: string) => {
  const response = await axiosInstance.delete(`/admin/items/${id}`);
  return response.data;
};

export const retireItem = async (id: string) => {
  const response = await axiosInstance.put(`/admin/items/${id}/retire`);
  return response.data.data.item;
};

export const bulkUploadItems = async (items: ItemFormData[]) => {
  const response = await axiosInstance.post("/admin/items/bulk-upload", { items });
  return response.data.data.results;
};

export const bulkUpdateItems = async (updates: Array<{ id: number } & Partial<ItemFormData>>) => {
  const response = await axiosInstance.put("/admin/items/bulk-update", { updates });
  return response.data.data.results;
};

export const bulkDeleteItems = async (ids: number[]) => {
  const response = await axiosInstance.delete("/admin/items/bulk-delete", { data: { ids } });
  return response.data.data.results;
};

export const bulkRetireItems = async (ids: number[]) => {
  const response = await axiosInstance.put("/admin/items/bulk-retire", { ids });
  return response.data.data.results;
};

export const checkDeletableItems = async (ids: number[]) => {
  const response = await axiosInstance.post("/admin/items/check-deletable", { ids });
  return response.data.data.results;
};
