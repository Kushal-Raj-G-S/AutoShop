"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, CategoryInput } from "@/lib/api/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useToast } from "@/hooks/use-toast";

export default function NewCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      // Clear category cache
      await queryClient.resetQueries({ queryKey: ["admin-categories"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      // Navigate and force refresh
      router.push("/categories");
      setTimeout(() => {
        router.refresh();
        window.location.href = '/categories';
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CategoryInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/categories">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Category</h1>
          <p className="text-gray-500 mt-1">Create a new product category</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            onSubmit={handleSubmit}
            submitLabel="Create Category"
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
