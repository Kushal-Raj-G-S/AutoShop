"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVendor } from "@/lib/api/vendors";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Zod validation schema - simplified
const vendorSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  address: z.string().optional(),
  documentUrl: z.string().url("Document URL must be a valid URL").optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function CreateVendorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      latitude: 0,
      longitude: 0,
    }
  });

  const storeName = watch("storeName");
  const address = watch("address");

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      router.push("/vendors");
      setTimeout(() => {
        window.location.href = '/vendors';
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendors">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Vendor</h1>
          <p className="text-gray-500 mt-1">Add a new vendor to the platform</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Store Name and Owner Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">
                  Store Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="storeName"
                  placeholder="e.g., AutoCare Workshop"
                  {...register("storeName")}
                  className={errors.storeName ? "border-red-500" : ""}
                />
                {errors.storeName && (
                  <p className="text-sm text-red-500">{errors.storeName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">
                  Owner Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ownerName"
                  placeholder="e.g., John Doe"
                  {...register("ownerName")}
                  className={errors.ownerName ? "border-red-500" : ""}
                />
                {errors.ownerName && (
                  <p className="text-sm text-red-500">{errors.ownerName.message}</p>
                )}
              </div>
            </div>

            {/* Phone and Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="9876543210"
                  {...register("phone")}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Shop address"
                  {...register("address")}
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">
                  Latitude <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="12.9716"
                  {...register("latitude", { valueAsNumber: true })}
                />
                {errors.latitude && (
                  <p className="text-sm text-red-500">{errors.latitude.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">
                  Longitude <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="77.5946"
                  {...register("longitude", { valueAsNumber: true })}
                />
                {errors.longitude && (
                  <p className="text-sm text-red-500">{errors.longitude.message}</p>
                )}
              </div>
            </div>

            {/* Document URL */}
            <div className="space-y-2">
              <Label htmlFor="documentUrl">
                KYC Document URL <span className="text-gray-400">(Optional)</span>
              </Label>
              <Input
                id="documentUrl"
                placeholder="https://example.com/kyc-document.pdf"
                {...register("documentUrl")}
                className={errors.documentUrl ? "border-red-500" : ""}
              />
              {errors.documentUrl && (
                <p className="text-sm text-red-500">{errors.documentUrl.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Upload KYC documents to cloud storage and paste the link here
              </p>
            </div>

            {/* Preview Card */}
            {storeName && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Store:</span> {storeName}</p>
                  {address && <p><span className="font-medium">Address:</span> {address}</p>}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Link href="/vendors">
              <Button type="button" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Vendor"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
