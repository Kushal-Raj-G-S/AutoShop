"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorById, approveVendor, rejectVendor } from "@/lib/api/vendors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VendorStatusBadge } from "@/components/vendors/VendorStatusBadge";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2, MapPin, Phone, User, Store } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: vendor, isLoading, isError, error } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () => getVendorById(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Vendor Approved",
        description: "The vendor has been successfully approved.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve vendor",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Vendor Rejected",
        description: "The vendor has been rejected.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject vendor",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Vendor</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Vendor not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vendors">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vendors
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = vendor.status === "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{vendor.storeName}</h1>
            <p className="text-gray-500 mt-1">Vendor ID: {vendor.id}</p>
          </div>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Store Name</p>
                  <p className="mt-1 text-lg font-semibold">{vendor.storeName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Owner Name</p>
                  <p className="mt-1 text-lg font-semibold">{vendor.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {vendor.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Registered On</p>
                  <p className="mt-1">{formatDate(vendor.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Latitude</p>
                  <p className="mt-1 font-mono">{vendor.latitude}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Longitude</p>
                  <p className="mt-1 font-mono">{vendor.longitude}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Account Information */}
          {vendor.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="mt-1">{vendor.user.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="mt-1 capitalize">{vendor.user.role}</p>
                  </div>
                  {vendor.user.name && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1">{vendor.user.name}</p>
                    </div>
                  )}
                  {vendor.user.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1">{vendor.user.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Manage vendor approval status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPending ? (
                <>
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Vendor
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending}
                    variant="destructive"
                    className="w-full"
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Vendor
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  This vendor has already been {vendor.status}.
                  {vendor.status === "rejected" && (
                    <Button
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                      className="w-full mt-3"
                      variant="outline"
                    >
                      {approveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        "Approve Anyway"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document */}
          {vendor.documentUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Document</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={vendor.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  View Document
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
