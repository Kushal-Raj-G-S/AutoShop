"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api/orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search } from "lucide-react";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, statusFilter, search],
    queryFn: () =>
      getOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage customer orders</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by order ID, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "" ? "default" : "outline"}
                onClick={() => setStatusFilter("")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "assigned" ? "default" : "outline"}
                onClick={() => setStatusFilter("assigned")}
              >
                Assigned
              </Button>
              <Button
                variant={statusFilter === "in-progress" ? "default" : "outline"}
                onClick={() => setStatusFilter("in-progress")}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                onClick={() => setStatusFilter("cancelled")}
              >
                Cancelled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Total: {data?.pagination?.total || 0} orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          ) : data?.orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customerName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerPhone}
                          </div>
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
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing page {data?.pagination?.page} of {data?.pagination?.totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= (data?.pagination?.totalPages || 1)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
