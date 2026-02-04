"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryInput } from "@/lib/api/categories";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  defaultValues?: Partial<CategoryInput>;
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      imageUrl: defaultValues?.imageUrl || "",
    },
  });

  const handleFormSubmit = (data: CategoryFormValues) => {
    const submitData: CategoryInput = {
      name: data.name,
    };

    if (data.description) {
      submitData.description = data.description;
    }

    if (data.imageUrl) {
      submitData.imageUrl = data.imageUrl;
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
          placeholder="e.g., Electronics, Clothing"
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

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          {...register("imageUrl")}
          placeholder="https://example.com/image.jpg"
          disabled={isSubmitting}
        />
        {errors.imageUrl && (
          <p className="text-sm text-red-500">{errors.imageUrl.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : submitLabel}
      </Button>
    </form>
  );
}
