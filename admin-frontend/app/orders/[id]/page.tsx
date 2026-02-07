"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderById, cancelOrder, triggerAutoAssignment } from "@/lib/api/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, UserCheck, Zap } from "lucide-react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { AssignVendorModal } from "@/components/orders/AssignVendorModal";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper functions to determine what actions are available based on order status
const canAssignVendor = (status: string) => {
  const assignableStatuses = ['payment_verified', 'paid', 'awaiting_assignment', 'assigned'];
  return assignableStatuses.includes(status);
};

const canReassignVendor = (status: string) => {
  // Can reassign if status is 'assigned' but NOT after vendor accepts
  // Once vendor accepts, status moves to 'vendor_accepted' or 'in_progress'
  return status === 'assigned';
};

const canCancelOrder = (status: string) => {
  const cancellableStatuses = ['payment_verified', 'paid', 'awaiting_assignment', 'assigned', 'vendor_accepted'];
  return cancellableStatuses.includes(status);
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const orderId = params.id as string;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, cancelReason || "Cancelled by admin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
      setCancelReason("");
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: () => triggerAutoAssignment(orderId),
    onSuccess: async () => {
      toast({
        title: "Auto-assignment Started",
        description: "Order pushed to nearby vendors. Waiting for acceptance...",
      });
      
      // Wait a moment for backend to update order status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      // Force refetch
      await queryClient.refetchQueries({ queryKey: ["order", orderId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to trigger auto-assignment",
        variant: "destructive",
      });
    },
  });

  const handleCancelSubmit = () => {
    cancelMutation.mutate();
  };

  // Order state transition guards
  const canAssignVendor = (status: string) => {
    return !['cancelled', 'completed'].includes(status);
  };

  const canCancelOrder = (status: string) => {
    return !['cancelled', 'completed'].includes(status);
  };

  const canReassignVendor = (status: string) => {
    // Allow reassignment unless order is vendor_accepted, in_progress, completed, or cancelled
    return !['vendor_accepted', 'in_progress', 'completed', 'cancelled'].includes(status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">
                {error instanceof Error ? error.message : "Order not found"}
              </p>
              <Link href="/orders">
                <Button>Back to Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-500 mt-1">View and manage order information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Show Auto Assign button only when no vendor assigned */}
          {canAssignVendor(order.status) && !order.vendorId && (
            <Button
              onClick={() => autoAssignMutation.mutate()}
              disabled={autoAssignMutation.isPending}
              variant="default"
            >
              {autoAssignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Auto Assigning...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Auto Assign
                </>
              )}
            </Button>
          )}

          {/* Show Manual Assign/Reassign Vendor button */}
          {canAssignVendor(order.status) && (
            // Check if vendor is already assigned and locked (status beyond 'assigned')
            order.vendorId && !canReassignVendor(order.status) ? (
              <Button variant="outline" disabled title="Cannot reassign vendor after acceptance">
                <UserCheck className="w-4 h-4 mr-2" />
                Vendor Locked
              </Button>
            ) : (
              // Show Assign or Reassign modal
              <AssignVendorModal orderId={orderId} currentVendorId={order.vendorId} />
            )
          )}
          
          {/* Show Cancel button only if order can be cancelled */}
          {canCancelOrder(order.status) && (
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this order? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="cancelReason" className="text-sm font-medium">
                    Cancellation Reason (Optional)
                  </Label>
                  <Textarea
                    id="cancelReason"
                    placeholder="Enter reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                    disabled={cancelMutation.isPending}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelMutation.isPending}>
                    Keep Order
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubmit}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Order"
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Order Number, Status, Date */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-2xl font-bold">{order.orderId}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Created At</p>
              <p className="text-lg font-medium">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer, Vendor, Payment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{order.customerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium">{order.deliveryAddress}</p>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.vendorId ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Store Name</p>
                    <p className="font-medium">{order.vendorStoreName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{order.vendorPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned At</p>
                    <p className="font-medium">
                      {order.assignedAt
                        ? new Date(order.assignedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </>
              ) : order.status === 'awaiting_assignment' ? (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                  <div>
                    <p className="font-medium text-yellow-900">Waiting for vendor acceptance</p>
                    <p className="text-sm text-yellow-700">Order has been pushed to nearby vendors. Waiting for response...</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No vendor assigned yet</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-600">Subtotal</p>
                <p className="font-medium">₹{Number(order.subtotal).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Tax</p>
                <p className="font-medium">₹{Number(order.tax).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Delivery Fee</p>
                <p className="font-medium">₹{Number(order.deliveryFee).toFixed(2)}</p>
              </div>
              <div className="flex justify-between border-t pt-3">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-lg font-bold text-blue-600">
                  ₹{Number(order.amount).toFixed(2)}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.items} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status Timeline */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                currentStatus={order.status}
                createdAt={order.createdAt}
                assignedAt={order.assignedAt}
                acceptedAt={order.acceptedAt}
                startedAt={order.startedAt}
                completedAt={order.completedAt}
                cancelledAt={order.cancelledAt}
              />
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {order.cancelledAt && order.cancellationReason && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">Cancellation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <p className="font-medium">{order.cancellationReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
