"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forceAssignOrder } from "@/lib/api/orders";
import { getVendors } from "@/lib/api/vendors";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck } from "lucide-react";

const assignVendorSchema = z.object({
  vendorId: z
    .string()
    .min(1, "Please select a vendor"),
});

type AssignVendorFormData = z.infer<typeof assignVendorSchema>;

interface AssignVendorModalProps {
  orderId: string;
  currentVendorId?: number;
}

export function AssignVendorModal({ orderId, currentVendorId }: AssignVendorModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch approved vendors only
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    enabled: open,
  });

  const approvedVendors = vendors?.filter((v) => v.status === "approved") || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AssignVendorFormData>({
    resolver: zodResolver(assignVendorSchema),
    defaultValues: {
      vendorId: currentVendorId ? String(currentVendorId) : "",
    },
  });

  const selectedVendorId = watch("vendorId");

  const assignMutation = useMutation({
    mutationFn: (vendorId: string) => forceAssignOrder(orderId, vendorId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor assigned to order successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignVendorFormData) => {
    assignMutation.mutate(data.vendorId);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!assignMutation.isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        reset();
      }
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {currentVendorId ? "Reassign Vendor" : "Assign Vendor"}
            </DialogTitle>
            <DialogDescription>
              Select an approved vendor to assign to this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">
                Select Vendor <span className="text-red-500">*</span>
              </Label>
              {vendorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading vendors...</span>
                </div>
              ) : approvedVendors.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No approved vendors available
                </div>
              ) : (
                <select
                  id="vendorId"
                  {...register("vendorId")}
                  className={
                    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 " +
                    (errors.vendorId ? "border-red-500" : "border-gray-300")
                  }
                  disabled={assignMutation.isPending}
                >
                  <option value="">-- Select a vendor --</option>
                  {approvedVendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.storeName} - {vendor.ownerName} ({vendor.phone})
                    </option>
                  ))}
                </select>
              )}
              {errors.vendorId && (
                <p className="text-sm text-red-500">{errors.vendorId.message}</p>
              )}
            </div>

            {currentVendorId && selectedVendorId && selectedVendorId !== String(currentVendorId) && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> You are reassigning this order to a different vendor.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={assignMutation.isPending || !selectedVendorId || approvedVendors.length === 0}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Vendor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
