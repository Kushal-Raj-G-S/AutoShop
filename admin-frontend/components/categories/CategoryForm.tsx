"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryInput } from "@/lib/api/categories";
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  defaultValues?: Partial<CategoryInput> & { imageUrl?: string };
  onSubmit: (data: CategoryInput) => void;
  submitLabel: string;
  isSubmitting?: boolean;
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
}: CategoryFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
    },
  });

  // Set initial image preview if editing
  useEffect(() => {
    if (defaultValues?.imageUrl && !imagePreview) {
      setImagePreview(defaultValues.imageUrl);
    }
  }, [defaultValues?.imageUrl]);

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

  const handleFormSubmit = async (data: CategoryFormValues) => {
    const submitData: CategoryInput = {
      name: data.name,
    };

    if (data.description) {
      submitData.description = data.description;
    }

    // If there's a new image file, convert to base64
    if (imageFile) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      const base64 = await base64Promise;
      submitData.imageUrl = base64;
    } else if (imagePreview && imagePreview !== defaultValues?.imageUrl) {
      // If preview exists but no new file, and it's different from default, use it
      submitData.imageUrl = imagePreview;
    } else if (imagePreview) {
      // Keep existing URL if no changes
      submitData.imageUrl = imagePreview;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Electronics, Filters"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Brief description of the category"
          rows={4}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="image">Category Image</Label>
        
        {imagePreview ? (
          <div className="relative w-full max-w-sm">
            <img
              src={imagePreview}
              alt="Category preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Label
              htmlFor="image"
              className="cursor-pointer text-sm text-gray-600"
            >
              Click to upload category image
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : submitLabel}
      </Button>
    </form>
  );
}
