"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  SubCategory,
} from "@/lib/api/subcategories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SubCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  categoryName: string;
}

export function SubCategoriesDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: SubCategoriesDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategory | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Fetch sub-categories for this category
  const { data: subCategoriesData, isLoading } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => listSubCategories({ categoryId }),
    enabled: open, // Only fetch when dialog is open
  });

  const subCategories = subCategoriesData?.subCategories || [];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsFormOpen(false);
      setEditingSubCategory(null);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      toast({
        title: "Success",
        description: "Sub-category created successfully",
      });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create sub-category",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      updateSubCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      toast({
        title: "Success",
        description: "Sub-category updated successfully",
      });
      setIsFormOpen(false);
      setEditingSubCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update sub-category",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      toast({
        title: "Success",
        description: "Sub-category deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSubCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete sub-category",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSubCategory) {
      updateMutation.mutate({
        id: editingSubCategory.id,
        payload: formData,
      });
    } else {
      createMutation.mutate({
        categoryId,
        ...formData,
      });
    }
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || "",
      isActive: subCategory.isActive,
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (subCategory: SubCategory) => {
    setSubCategoryToDelete(subCategory);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (subCategoryToDelete) {
      deleteMutation.mutate(subCategoryToDelete.id);
    }
  };

  const handleAddNew = () => {
    setEditingSubCategory(null);
    resetForm();
    setIsFormOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sub-Categories for {categoryName}</DialogTitle>
            <DialogDescription>
              Manage sub-categories under this category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!isFormOpen ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Total: {subCategories.length} sub-categories
                  </p>
                  <Button onClick={handleAddNew} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Sub-Category
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : subCategories.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-gray-500 mb-4">No sub-categories yet</p>
                    <Button onClick={handleAddNew} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Sub-Category
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subCategories.map((subCategory: SubCategory) => (
                          <TableRow key={subCategory.id}>
                            <TableCell className="font-medium">
                              {subCategory.name}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {subCategory.description || (
                                <span className="text-gray-400 text-sm">No description</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={subCategory.isActive ? "default" : "secondary"}>
                                {subCategory.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(subCategory)}
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(subCategory)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1 text-red-500" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sub-Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Engine Oil, Brake Pads"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingSubCategory ? "Update" : "Create"} Sub-Category
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingSubCategory(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sub-Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{subCategoryToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
