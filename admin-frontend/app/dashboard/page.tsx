"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getOrders } from "@/lib/api/orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Store, Package, FolderTree, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => getOrders({ limit: 10 }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const statCards = [
    {
      title: "Pending Vendors",
      value: stats?.pendingVendors || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Active Vendors",
      value: stats?.activeVendors || 0,
      icon: Store,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Categories",
      value: stats?.totalCategories || 0,
      icon: FolderTree,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Items",
      value: stats?.totalItems || 0,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
      pending: "outline",
      assigned: "secondary",
      "in-progress": "default",
      completed: "success",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome, Admin {user?.name ? `- ${user.name}` : ""}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? "..." : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest 10 orders in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : recentOrders?.orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName || "N/A"}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.itemCount || 0}</TableCell>
                    <TableCell>₹{Number(order.amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.vendorStoreName || "Unassigned"}</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
