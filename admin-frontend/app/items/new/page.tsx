"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createItem } from "@/lib/api/items";
import { getAdminCategories } from "@/lib/api/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const itemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(1, "SKU/Part Number is required"),
  brand: z.string().min(1, "Brand is required"),
  categoryId: z.number().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  tax: z.number().min(0).max(100, "Tax must be between 0-100%"),
  serviceTime: z.number().min(0, "Service time must be non-negative"),
  unitType: z.enum(["pcs", "box", "carton"], {
    errorMap: () => ({ message: "Unit type is required" }),
  }),
  stock: z.number().min(0, "Stock must be non-negative"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ItemFormData = z.infer<typeof itemSchema>;

export default function NewItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getAdminCategories,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      isActive: true,
      stock: 0,
      tax: 0,
      serviceTime: 0,
      unitType: "pcs",
    },
  });

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
    setImagePreview("");
  };

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      // If there's an image file, convert to base64 and add to data
      if (imageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        const base64 = await base64Promise;
        data.imageUrl = base64;
      }
      return createItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      
      // Force navigation and refresh
      router.push("/items");
      setTimeout(() => {
        window.location.href = '/items';
      }, 100);
    },
  });

  const onSubmit = (data: ItemFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/items">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Item</h1>
          <p className="text-gray-500 mt-1">Create a new product item</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            {createMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {(createMutation.error as any)?.response?.data?.message ||
                  "Failed to create item"}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Item"}
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