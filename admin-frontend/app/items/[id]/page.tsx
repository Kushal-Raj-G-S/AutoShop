"use client";

import { use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItemById, updateItem } from "@/lib/api/items";
import { getAdminCategories } from "@/lib/api/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  brand: z.string().min(1, "Brand is required"),
  categoryId: z.number().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be positive"),
  tax: z.number().min(0, "Tax must be non-negative").max(100, "Tax cannot exceed 100%"),
  serviceTime: z.number().min(0, "Service time must be non-negative"),
  unitType: z.enum(["pcs", "box", "carton"], { required_error: "Unit type is required" }),
  imageUrl: z.string().nullable().optional(),
  stock: z.number().min(0, "Stock must be non-negative").nullable().optional(),
  isActive: z.boolean(),
});

type ItemFormData = z.infer<typeof itemSchema>;

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => getItemById(id),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getAdminCategories,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  // Reset form and preview when item data is loaded
  useEffect(() => {
    if (item && !isLoading) {
      reset(item);
      if (item.imageUrl) {
        setImagePreview(item.imageUrl);
      }
    }
  }, [item, isLoading, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      console.log('📤 Update Item Data:', data);
      console.log('📸 Image file present:', !!imageFile);
      
      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        const base64 = await base64Promise;
        data.imageUrl = base64;
        console.log('✅ Image converted to base64');
      }
      
      console.log('🚀 Sending update request to API...');
      const response = await updateItem(id, data);
      console.log('✅ API Response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('✅ Item updated successfully');
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      
      console.log('🔄 Redirecting and refreshing...');
      // Force navigation and refresh
      router.push("/items");
      setTimeout(() => {
        window.location.href = '/items';
      }, 100);
    },
    onError: (error: any) => {
      console.error('❌ Update error:', error);
      console.error('❌ Error details:', error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ItemFormData) => {
    console.log('🎯 onSubmit triggered!');
    console.log('📋 Form submitted with data:', data);
    console.log('🔍 Form errors:', errors);
    console.log('🔍 Form validation passed:', Object.keys(errors).length === 0);
    
    if (Object.keys(errors).length > 0) {
      console.error('❌ Form has validation errors, cannot submit');
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Calling updateMutation.mutate...');
    updateMutation.mutate(data);
  };

  const onError = (errors: any) => {
    console.error('❌ FORM VALIDATION FAILED:', errors);
    console.error('❌ All error fields:', Object.keys(errors));
    Object.keys(errors).forEach(field => {
      console.error(`   - ${field}: ${errors[field]?.message}`);
    });
    toast({
      title: "Validation Error",
      description: `Please fix errors in: ${Object.keys(errors).join(', ')}`,
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-500">Loading item...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-500 mb-4">Item not found</div>
        <Link href="/items">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/items">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Item</h1>
          <p className="text-gray-500 mt-1">Update item information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={(e) => {
              console.log('📝 Form onSubmit event fired!');
              handleSubmit(onSubmit, onError)(e);
            }} 
            className="space-y-6"
          >
            {/* Row 1: Name and SKU */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Brake Pads Set"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU/Part Number *</Label>
                <Input
                  id="sku"
                  placeholder="e.g., BP-001"
                  {...register("sku")}
                />
                {errors.sku && (
                  <p className="text-sm text-red-500">{errors.sku.message}</p>
                )}
              </div>
            </div>

            {/* Row 2: Brand and Category */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Brembo"
                  {...register("brand")}
                />
                {errors.brand && (
                  <p className="text-sm text-red-500">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  {...register("categoryId", { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                )}
              </div>
            </div>

            {/* Row 3: Sub-category and Unit Type */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub-category *</Label>
                <Input
                  id="subCategory"
                  placeholder="e.g., Brake Systems"
                  {...register("subCategory")}
                />
                {errors.subCategory && (
                  <p className="text-sm text-red-500">{errors.subCategory.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitType">Unit Type *</Label>
                <select
                  id="unitType"
                  {...register("unitType")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box</option>
                  <option value="carton">Carton</option>
                </select>
                {errors.unitType && (
                  <p className="text-sm text-red-500">{errors.unitType.message}</p>
                )}
              </div>
            </div>

            {/* Row 4: Price, Tax, Stock, Service Time */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Tax (%) *</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  placeholder="18"
                  {...register("tax", { valueAsNumber: true })}
                />
                {errors.tax && (
                  <p className="text-sm text-red-500">{errors.tax.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  {...register("stock", { valueAsNumber: true })}
                />
                {errors.stock && (
                  <p className="text-sm text-red-500">{errors.stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceTime">Service Time (min) *</Label>
                <Input
                  id="serviceTime"
                  type="number"
                  placeholder="30"
                  {...register("serviceTime", { valueAsNumber: true })}
                />
                {errors.serviceTime && (
                  <p className="text-sm text-red-500">{errors.serviceTime.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Enter detailed product description"
                {...register("description")}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="border-2 border-dashed rounded-lg p-6">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload product image
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible in app)
              </Label>
            </div>

            {/* Error Display */}
            {updateMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {(updateMutation.error as any)?.response?.data?.message ||
                  "Failed to update item"}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                onClick={(e) => {
                  console.log('🖱️ Update button clicked!');
                  console.log('🔍 Button type:', e.currentTarget.type);
                }}
              >
                {updateMutation.isPending ? "Updating..." : "Update Item"}
              </Button>
              <Link href="/items">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
