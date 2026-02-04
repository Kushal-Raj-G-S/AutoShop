import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  role: string;
  exp: number;
}

export const validateRole = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return false;
    }
    
    // Check if role is admin
    return decoded.role === "admin";
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

export const getDecodedToken = (token: string | null): DecodedToken | null => {
  if (!token) return null;

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};
