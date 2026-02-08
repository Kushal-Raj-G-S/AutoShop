"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Store, 
  FolderTree,
  Ruler, 
  Package, 
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FileText,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/vendors", icon: Store, label: "Vendors" },
    { href: "/categories", icon: FolderTree, label: "Categories" },
    { href: "/units", icon: Ruler, label: "Units" },
    { href: "/items", icon: Package, label: "Items" },
    { href: "/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/users", icon: Users, label: "Users" },
    { href: "/activity-logs", icon: Activity, label: "Activity Logs" },
    { href: "/reports", icon: FileText, label: "Reports" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  // Show loading screen with sidebar
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar - Fully visible during loading */}
        <div className="w-64 bg-white shadow-lg flex flex-col">
          <div className="flex flex-col h-screen">
            {/* Logo */}
            <div className="p-6 border-b flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              <div className="mt-2 text-sm text-gray-600">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t flex-shrink-0">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* Loading spinner - Content area only */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            {user && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">{user.name || "Admin"}</p>
                <p className="text-xs truncate">{user.phoneNumber}</p>
              </div>
            )}
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button - Always visible at bottom */}
          <div className="p-4 border-t flex-shrink-0">
            <Button
              onClick={logout}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
