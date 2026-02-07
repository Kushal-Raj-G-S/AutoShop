"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forceAssignOrder, getNearbyVendors } from "@/lib/api/orders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, MapPin, Phone, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AssignVendorModalProps {
  orderId: string;
  currentVendorId?: number;
}

export function AssignVendorModal({ orderId, currentVendorId }: AssignVendorModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch nearby vendors
  const { data: nearbyVendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["nearbyVendors", orderId],
    queryFn: () => getNearbyVendors(orderId),
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (vendorId: number) => forceAssignOrder(orderId, vendorId.toString()),
    onSuccess: () => {
      const isReassignment = !!currentVendorId;
      console.log('Assignment success - currentVendorId:', currentVendorId, 'isReassignment:', isReassignment);
      toast({
        title: isReassignment ? "Vendor Reassigned" : "Vendor Assigned",
        description: isReassignment 
          ? "Order has been reassigned to a different vendor successfully."
          : "Vendor assigned to order successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign vendor",
        variant: "destructive",
      });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!assignMutation.isPending) {
      setOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCheck className="w-4 h-4 mr-2" />
          {currentVendorId ? "Reassign Vendor" : "Assign Vendor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentVendorId ? "Reassign Vendor" : "Assign Vendor"}
          </DialogTitle>
          <DialogDescription>
            Select a nearby vendor based on proximity to delivery location
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-y-auto">
          {vendorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading nearby vendors...</span>
            </div>
          ) : !nearbyVendors || nearbyVendors.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No vendors available within 10km radius
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Store className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="font-semibold text-gray-900">
                              {vendor.storeName}
                            </div>
                            <div className="text-sm text-gray-600">{vendor.ownerName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {vendor.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {vendor.distance} km away
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 ml-8 mt-1">
                          {vendor.storeAddress}
                        </div>
                      </div>
                      <Button
                        onClick={() => assignMutation.mutate(vendor.id)}
                        disabled={assignMutation.isPending}
                        size="sm"
                      >
                        {assignMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Assigning...</>
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
