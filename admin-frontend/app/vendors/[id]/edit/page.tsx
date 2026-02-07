"use client";

import { use, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorById, updateVendor } from "@/lib/api/vendors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface BankDetailsForm {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
}

export default function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () => getVendorById(id),
  });

  const [formData, setFormData] = useState({
    storeName: vendor?.storeName || "",
    ownerName: vendor?.ownerName || "",
    phone: vendor?.phone || "",
    storeAddress: vendor?.storeAddress || "",
    pincode: vendor?.pincode || "",
    latitude: vendor?.latitude?.toString() || "",
    longitude: vendor?.longitude?.toString() || "",
    serviceAreas: vendor?.serviceAreas?.join(", ") || "",
    bankDetails: {
      accountNumber: vendor?.bankDetails?.accountNumber || "",
      ifscCode: vendor?.bankDetails?.ifscCode || "",
      accountHolderName: vendor?.bankDetails?.accountHolderName || "",
      bankName: vendor?.bankDetails?.bankName || "",
      branchName: vendor?.bankDetails?.branchName || "",
    } as BankDetailsForm,
  });

  // Update form when vendor data loads
  useState(() => {
    if (vendor) {
      setFormData({
        storeName: vendor.storeName || "",
        ownerName: vendor.ownerName || "",
        phone: vendor.phone || "",
        storeAddress: vendor.storeAddress || "",
        pincode: vendor.pincode || "",
        latitude: vendor.latitude?.toString() || "",
        longitude: vendor.longitude?.toString() || "",
        serviceAreas: vendor.serviceAreas?.join(", ") || "",
        bankDetails: {
          accountNumber: vendor.bankDetails?.accountNumber || "",
          ifscCode: vendor.bankDetails?.ifscCode || "",
          accountHolderName: vendor.bankDetails?.accountHolderName || "",
          bankName: vendor.bankDetails?.bankName || "",
          branchName: vendor.bankDetails?.branchName || "",
        },
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updateData: any = {
        storeName: formData.storeName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        storeAddress: formData.storeAddress || undefined,
        pincode: formData.pincode || undefined,
      };

      if (formData.latitude && formData.longitude) {
        updateData.latitude = parseFloat(formData.latitude);
        updateData.longitude = parseFloat(formData.longitude);
      }

      if (formData.serviceAreas) {
        updateData.serviceAreas = formData.serviceAreas
          .split(",")
          .map((area) => area.trim())
          .filter((area) => area);
      }

      const bankDetails = formData.bankDetails;
      if (
        bankDetails.accountNumber ||
        bankDetails.ifscCode ||
        bankDetails.accountHolderName ||
        bankDetails.bankName ||
        bankDetails.branchName
      ) {
        updateData.bankDetails = bankDetails;
      }

      return updateVendor(id, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      router.push(`/vendors/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">Vendor not found</p>
        <Link href="/vendors">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/vendors/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Vendor</h1>
            <p className="text-gray-500">Update vendor information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/vendors/${id}`}>
            <Button variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Store and owner details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Address & Location</CardTitle>
            <CardDescription>Store address and coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Textarea
                id="storeAddress"
                value={formData.storeAddress}
                onChange={(e) =>
                  setFormData({ ...formData, storeAddress: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Service Areas</CardTitle>
            <CardDescription>
              Comma-separated list of pincodes this vendor serves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="serviceAreas">Service Areas (Pincodes)</Label>
              <Input
                id="serviceAreas"
                value={formData.serviceAreas}
                onChange={(e) =>
                  setFormData({ ...formData, serviceAreas: e.target.value })
                }
                placeholder="e.g., 560001, 560002, 560003"
              />
              <p className="text-sm text-gray-500">
                Enter pincodes separated by commas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Payment and KYC information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        accountNumber: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        ifscCode: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={formData.bankDetails.accountHolderName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        accountHolderName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankDetails.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  value={formData.bankDetails.branchName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: {
                        ...formData.bankDetails,
                        branchName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
