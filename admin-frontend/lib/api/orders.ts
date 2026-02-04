import axiosInstance from "./axios";

export interface OrderItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: string | number;
  total: string | number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Vendor {
  id: number;
  storeName: string;
  phone: string;
}

export interface OrderDetail {
  id: number;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vendorId?: number;
  vendorStoreName?: string;
  vendorPhone?: string;
  amount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: OrderItem[];
}

export interface Order {
  id: number;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  vendorStoreName?: string;
  amount: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface DashboardStats {
  pendingVendors: number;
  activeVendors: number;
  totalCategories: number;
  totalItems: number;
  totalOrders: number;
  todayOrders: number;
}

export const getOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const response = await axiosInstance.get("/admin/orders", { params });
  // Backend returns {success, message, data: {orders: [...], pagination: {...}}}
  return response.data.data;
};

export const getOrderById = async (id: string) => {
  const response = await axiosInstance.get(`/admin/orders/${id}`);
  // Backend returns {success, message, data: {order: {...}}}
  return response.data.data.order;
};

export const forceAssignOrder = async (orderId: string, vendorId: string) => {
  const response = await axiosInstance.post(`/admin/orders/${orderId}/force-assign`, {
    vendorId,
  });
  return response.data;
};

export const cancelOrder = async (orderId: string, reason?: string) => {
  const response = await axiosInstance.post(`/admin/orders/${orderId}/cancel`, {
    reason,
  });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await axiosInstance.get("/admin/stats");
  // Backend returns {success, message, data: {stats object}}
  return response.data.data;
};
