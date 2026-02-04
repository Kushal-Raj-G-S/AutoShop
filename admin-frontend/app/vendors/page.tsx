"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVendors, type VendorStatus } from "@/lib/api/vendors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VendorsTable } from "@/components/vendors/VendorsTable";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";

export default function VendorsPage() {
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");

  const { data: vendorsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  console.log('🔍 Vendors Query Data:', vendorsData);
  
  const vendors = vendorsData || [];
  console.log('✅ Vendors array:', vendors.length, 'vendors');

  // Client-side filtering
  const filteredVendors = useMemo(() => {
    if (statusFilter === "all") {
      return vendors;
    }
    return vendors.filter((vendor) => vendor.status === statusFilter);
  }, [vendors, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Vendors</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Failed to load vendors"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">Manage vendor accounts and approvals</p>
        </div>
        <Link href="/vendors/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
          <CardDescription>
            Showing {filteredVendors.length} of {vendors.length} vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All ({vendors.length})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({vendors.filter((v) => v.status === "pending").length})
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              onClick={() => setStatusFilter("approved")}
            >
              Approved ({vendors.filter((v) => v.status === "approved").length})
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected ({vendors.filter((v) => v.status === "rejected").length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor List</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorsTable vendors={filteredVendors} />
        </CardContent>
      </Card>
    </div>
  );
}
