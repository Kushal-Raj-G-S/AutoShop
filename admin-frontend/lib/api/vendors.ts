import axiosInstance from "./axios";

export type VendorStatus = "pending" | "approved" | "rejected";

export interface Vendor {
  id: number;
  userId: string;
  storeName: string;
  ownerName: string;
  phone: string;
  documentUrl: string;
  latitude: number;
  longitude: number;
  status: VendorStatus;
  createdAt: string;
}

export interface VendorDetail extends Vendor {
  user?: {
    id: string;
    phoneNumber: string;
    role: string;
    name?: string | null;
    email?: string | null;
  };
}

export interface CreateVendorInput {
  storeName: string;
  ownerName: string;
  phone: string;
  documentUrl: string;
  latitude: number;
  longitude: number;
}

export const getVendors = async (): Promise<Vendor[]> => {
  const response = await axiosInstance.get("/admin/vendors");
  console.log('🔍 Vendors API Response:', response.data);
  
  // Backend returns: { success, message, data: { vendors } }
  const vendors = response.data?.data?.vendors || [];
  console.log('✅ Extracted vendors:', vendors.length, 'vendors');
  
  return vendors;
};

export const getVendorById = async (id: string): Promise<VendorDetail> => {
  const response = await axiosInstance.get(`/admin/vendors/${id}`);
  console.log('🔍 Vendor Detail API Response:', response.data);
  
  // Backend returns: { success, message, data: { vendor } }
  const vendor = response.data?.data?.vendor;
  console.log('✅ Extracted vendor:', vendor);
  
  return vendor;
};

export const createVendor = async (data: CreateVendorInput): Promise<Vendor> => {
  const response = await axiosInstance.post("/admin/vendors", data);
  // Backend returns: { success, message, data: { vendor } }
  return response.data?.data?.vendor || response.data;
};

export const approveVendor = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/approve`);
};

export const rejectVendor = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/reject`);
};
