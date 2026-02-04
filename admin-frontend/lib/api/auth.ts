import axiosInstance from "./axios";

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
  role?: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  role: string;
  name?: string | null;
  email?: string | null;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  data?: {
    otp?: string; // Only in dev/staging
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface ProfileResponse {
  id: string;
  phoneNumber: string;
  name?: string | null;
  email?: string | null;
  role: string;
  isActive: string;
  createdAt: string;
}

export const sendOTP = async (data: SendOTPRequest): Promise<SendOTPResponse> => {
  const response = await axiosInstance.post<SendOTPResponse>("/auth/send-otp", data);
  return response.data;
};

export const verifyOTP = async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  const response = await axiosInstance.post("/auth/verify-otp", {
    ...data,
    role: "admin", // Always request admin role
  });
  // Backend wraps response in {success, message, data: {user, token}}
  return {
    success: response.data.success,
    message: response.data.message,
    user: response.data.data.user,
    token: response.data.data.token,
  };
};

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await axiosInstance.get("/auth/profile");
  // Backend wraps response in {success, message, data: {user: {...}}}
  return response.data.data.user;
};
