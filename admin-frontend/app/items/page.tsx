"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, deleteItem, bulkUpdateItems, bulkDeleteItems, bulkRetireItems, checkDeletableItems } from "@/lib/api/items";
import { getAdminCategories } from "@/lib/api/categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Upload, CheckSquare, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<number[]>([]);
  const [singleDeleteDialog, setSingleDeleteDialog] = useState<{open: boolean, id: string, name: string}>({open: false, id: '', name: ''});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch all items (backend doesn't support categoryId filter in admin endpoint)
  const { data: itemsResponse, isLoading, refetch } = useQuery({
    queryKey: ["items", debouncedSearch],
    queryFn: () =>
      getItems({
        search: debouncedSearch || undefined,
      }),
    staleTime: 0, // Always refetch to show latest data
  });

  console.log('🔍 Items Response:', itemsResponse);

  // Client-side category filtering since backend admin endpoint doesn't support it
  const items = React.useMemo(() => {
    const allItems = itemsResponse || [];
    if (!categoryFilter) {
      return allItems;
    }
    // Convert categoryFilter to number for comparison since backend returns categoryId as number
    const filterAsNumber = parseInt(categoryFilter);
    console.log('🔍 Filtering - categoryFilter:', categoryFilter, 'as number:', filterAsNumber);
    const filtered = allItems.filter(item => {
      console.log('  - Item:', item.name, 'categoryId:', item.categoryId, 'type:', typeof item.categoryId);
      return item.categoryId === filterAsNumber;
    });
    return filtered;
  }, [itemsResponse, categoryFilter]);

  console.log('✅ Filtered items:', items.length, 'items (categoryFilter:', categoryFilter, ')');

  // Pagination logic
  const totalPages = Math.ceil((items?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items?.slice(startIndex, endIndex) || [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter]);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategories,
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateItems,
    onSuccess: (results) => {
      console.log('✅ Frontend: Bulk update success, refetching data');
      refetch(); // Direct refetch
      setSelectedItems([]);
      setBulkAction("");
      toast({
        title: "Success",
        description: `${results.successful.length} items updated successfully`,
      });
      if (results.failed.length > 0) {
        toast({
          title: "Warning",
          description: `${results.failed.length} items failed to update`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update items",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteItems,
    onSuccess: (results) => {
      refetch();
      setSelectedItems([]);
      setBulkAction("");
      toast({
        title: "Success",
        description: `${results.successful.length} items deleted successfully`,
      });
      if (results.failed.length > 0) {
        toast({
          title: "Warning",
          description: `${results.failed.length} items failed to delete`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete items",
        variant: "destructive",
      });
    },
  });

  const bulkRetireMutation = useMutation({
    mutationFn: bulkRetireItems,
    onSuccess: (results) => {
      console.log('✅ Frontend: Bulk retire success, refetching data');
      refetch(); // Direct refetch
      setSelectedItems([]);
      setBulkAction("");
      toast({
        title: "Success",
        description: `${results.successful.length} items retired successfully`,
      });
      if (results.failed.length > 0) {
        toast({
          title: "Warning",
          description: `${results.failed.length} items failed to retire`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to retire items",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    setSingleDeleteDialog({open: true, id, name});
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items?.map(item => item.id) || []);
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.length === 0 || !bulkAction) return;

    console.log('🎯 Bulk Action:', bulkAction, 'Items:', selectedItems);

    switch (bulkAction) {
      case 'activate':
        const activateUpdates = selectedItems.map(id => ({ id, isActive: true }));
        console.log('📤 Activating items:', activateUpdates);
        bulkUpdateMutation.mutate(activateUpdates);
        break;
      case 'deactivate':
        const deactivateUpdates = selectedItems.map(id => ({ id, isActive: false }));
        console.log('📤 Deactivating items:', deactivateUpdates);
        bulkUpdateMutation.mutate(deactivateUpdates);
        break;
      case 'retire':
        console.log('📤 Retiring items:', selectedItems);
        bulkRetireMutation.mutate(selectedItems);
        break;
      case 'delete':
        // First check which items can be deleted
        try {
          const checkResult = await checkDeletableItems(selectedItems);
          
          if (checkResult.nonDeletable.length > 0) {
            const itemNames = checkResult.nonDeletable.map(item => `#${item.id}`).join(', ');
            toast({
              title: "Cannot Delete Some Items",
              description: `Items ${itemNames} have existing orders and cannot be deleted. Use "Retire" instead for these items.`,
              variant: "destructive",
            });
          }

          if (checkResult.deletable.length === 0) {
            toast({
              title: "No Items to Delete",
              description: "All selected items have existing orders. Use 'Retire' instead.",
              variant: "destructive",
            });
            return;
          }

          // Show custom confirmation dialog for deletable items
          setItemsToDelete(checkResult.deletable);
          setDeleteDialogOpen(true);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to check deletable items",
            variant: "destructive",
          });
        }
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-500 mt-1">Manage product items</p>
        </div>
        <div className="flex gap-2">
          <Link href="/items/bulk-upload">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
          </Link>
          <Link href="/items/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-md px-4 py-2 min-w-[200px]"
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <Card className="bg-blue-50 border-blue-200 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-3">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="border border-blue-300 rounded-md px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select bulk action...</option>
                  <option value="activate">✓ Activate Items</option>
                  <option value="deactivate">✗ Deactivate Items</option>
                  <option value="retire">🔒 Retire Items (Safer)</option>
                  <option value="delete">🗑 Delete Items</option>
                </select>
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkUpdateMutation.isPending || bulkDeleteMutation.isPending || bulkRetireMutation.isPending}
                  className="min-w-[100px]"
                >
                  {bulkUpdateMutation.isPending || bulkDeleteMutation.isPending || bulkRetireMutation.isPending ? "Processing..." : "Apply Action"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedItems([]);
                    setBulkAction("");
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Item Inventory</CardTitle>
              <CardDescription className="mt-1">
                Showing {items?.length || 0} of {items?.length || 0} items
                {categoryFilter && ` in selected category`}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading items...</p>
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-2" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No items found</p>
              <p className="text-gray-400 mt-2 mb-4">
                {debouncedSearch || categoryFilter
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first item"}
              </p>
              {!debouncedSearch && !categoryFilter && (
                <Link href="/items/new">
                  <Button className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Item
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center w-full"
                    >
                      {selectedItems.length === items?.length && items?.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems?.map((item) => {
                  const isDeleting = deleteMutation.isPending;
                  return (
                  <TableRow 
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <TableCell className="py-4">
                      <button
                        onClick={() => toggleSelectItem(item.id)}
                        className="flex items-center justify-center w-full hover:opacity-70 transition-opacity"
                        disabled={isDeleting}
                      >
                        {selectedItems.includes(item.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{item.name}</span>
                        {item.sku && (
                          <span className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-700">{item.categoryName || "N/A"}</span>
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-gray-900">
                      ₹{Number(item.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`font-medium ${
                        (item.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.stock || 0}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={item.isActive ? "success" : "secondary"}
                        className="font-medium"
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 text-sm">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-2">
                        <Link href={`/items/${item.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(String(item.id), item.name)}
                          disabled={isDeleting}
                          className="hover:bg-red-600"
                        >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && items && items.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">{Math.min(endIndex, items.length)}</span> of{" "}
                <span className="font-medium">{items.length}</span> items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              Permanently Delete Items?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <p className="text-gray-700">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900">{itemsToDelete.length} item(s)</span>?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Items to delete:</p>
              <p className="text-sm text-gray-800 font-mono">
                {itemsToDelete.map(id => `#${id}`).join(', ')}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ This action cannot be undone!
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemsToDelete([]);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                console.log('📤 Deleting items:', itemsToDelete);
                bulkDeleteMutation.mutate(itemsToDelete);
                setDeleteDialogOpen(false);
                setItemsToDelete([]);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Item Delete Confirmation Dialog */}
      <Dialog open={singleDeleteDialog.open} onOpenChange={(open) => setSingleDeleteDialog({open, id: '', name: ''})}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              Delete Item?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <p className="text-gray-700">
              Are you sure you want to delete this item?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-1">Item:</p>
              <p className="text-base text-gray-900 font-semibold">
                {singleDeleteDialog.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ID: #{singleDeleteDialog.id}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ This action cannot be undone!
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSingleDeleteDialog({open: false, id: '', name: ''})}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate(singleDeleteDialog.id);
                setSingleDeleteDialog({open: false, id: '', name: ''});
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
