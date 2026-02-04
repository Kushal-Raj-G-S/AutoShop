"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, type User as AuthUser } from "@/lib/api/auth";

interface User {
  id: string;
  phoneNumber: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch profile from backend to verify token and role
        const profile = await getProfile();
        
        // Check if user is admin
        if (profile.role !== "admin") {
          // Not an admin, clear storage and logout
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        setUser({
          id: profile.id,
          phoneNumber: profile.phoneNumber,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        });
        setIsAuthenticated(true);
        setIsAdmin(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: AuthUser) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    setUser({
      id: userData.id,
      phoneNumber: userData.phoneNumber,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
    setIsAuthenticated(true);
    setIsAdmin(userData.role === "admin");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    router.push("/login");
  };

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    logout,
  };
};
