import axiosInstance from "./axios";

export type VendorStatus = "pending" | "approved" | "rejected" | "blocked";

export interface BankDetails {
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  branchName?: string;
}

export interface RequiredDocument {
  name: string;
  status: "pending" | "submitted" | "verified";
  url?: string;
  note?: string;
}

export interface AdminNote {
  note: string;
  timestamp: string;
  action?: "approved" | "rejected" | "note_added" | "blocked" | "unblocked";
  addedBy?: string;
}

export interface Vendor {
  id: number;
  userId: string;
  storeName: string;
  ownerName: string;
  phone: string;
  documentUrl: string;
  storeAddress?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  serviceAreas?: string[]; // Array of pincodes/areas
  bankDetails?: BankDetails;
  adminNotes?: AdminNote[]; // Array of admin notes with timestamps
  requiredDocuments?: RequiredDocument[]; // Required documents tracking
  status: VendorStatus;
  createdAt: string;
  updatedAt?: string; // Last update timestamp
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
  storeAddress?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  serviceAreas?: string[];
  bankDetails?: BankDetails;
}

export interface UpdateVendorInput {
  storeName?: string;
  ownerName?: string;
  phone?: string;
  documentUrl?: string;
  storeAddress?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  serviceAreas?: string[];
  bankDetails?: BankDetails;
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
  // Validate ID before making request
  if (!id || id === 'undefined' || isNaN(Number(id))) {
    throw new Error('Invalid vendor ID');
  }
  
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

export const approveVendor = async (id: string, adminNotes?: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/approve`, { adminNotes });
};

export const rejectVendor = async (id: string, adminNotes?: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/reject`, { adminNotes });
};

export const blockVendor = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/block`);
};

export const unblockVendor = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/unblock`);
};

export const updateRequiredDocuments = async (id: string, requiredDocuments: RequiredDocument[]): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/required-documents`, { requiredDocuments });
};

export const updateAdminNotes = async (id: string, adminNotes: string): Promise<void> => {
  await axiosInstance.patch(`/admin/vendors/${id}/admin-notes`, { adminNotes });
};

export const updateVendor = async (id: string, data: UpdateVendorInput): Promise<Vendor> => {
  const response = await axiosInstance.put(`/admin/vendors/${id}`, data);
  return response.data?.data?.vendor || response.data;
};

export const deleteVendor = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/admin/vendors/${id}`);
};
