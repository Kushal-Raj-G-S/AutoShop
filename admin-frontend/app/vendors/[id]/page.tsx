"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVendorById,
  approveVendor,
  rejectVendor,
  blockVendor,
  unblockVendor,
  deleteVendor,
  updateRequiredDocuments,
  updateAdminNotes,
  type RequiredDocument,
  type AdminNote,
} from "@/lib/api/vendors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VendorStatusBadge } from "@/components/vendors/VendorStatusBadge";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Phone, User, Store, Edit, Trash2, Ban, ShieldCheck, Building2, CreditCard, MapPinned, ChevronDown, ChevronUp, FileText, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState("");

  const { data: vendor, isLoading, isError, error } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () => getVendorById(id),
    enabled: !!id && id !== "undefined" && !isNaN(Number(id)), // Only fetch if ID is valid
  });

  const approveMutation = useMutation({
    mutationFn: () => approveVendor(id, approvalNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Vendor Approved",
        description: "The vendor has been successfully approved.",
        variant: "default",
      });
      setShowApproveDialog(false);
      setApprovalNotes("");
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve vendor",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectVendor(id, rejectionNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Vendor Rejected",
        description: "The vendor has been rejected.",
        variant: "default",
      });
      setShowRejectDialog(false);
      setRejectionNotes("");
    },
    onError: (error) => {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject vendor",
        variant: "destructive",
      });
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => blockVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Vendor Blocked",
        description: "The vendor has been blocked successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Block Failed",
        description: error instanceof Error ? error.message : "Failed to block vendor",
        variant: "destructive",
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Vendor Unblocked",
        description: "The vendor has been unblocked successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unblock Failed",
        description: error instanceof Error ? error.message : "Failed to unblock vendor",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(id),
    onSuccess: () => {
      toast({
        title: "Vendor Deleted",
        description: "The vendor has been permanently deleted.",
      });
      router.push("/vendors");
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => updateAdminNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      toast({
        title: "Note Added",
        description: "Admin note has been added successfully.",
      });
      setEditingNotes(false);
      setAdminNotesInput("");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const updateDocumentsMutation = useMutation({
    mutationFn: (docs: RequiredDocument[]) => updateRequiredDocuments(id, docs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      toast({
        title: "Documents Updated",
        description: "Required documents have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update documents",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-medium text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Vendor Not Found</CardTitle>
            <CardDescription className="text-sm mt-2">
              {error instanceof Error ? error.message : "The requested vendor could not be found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/vendors">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vendors
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = vendor.status === "pending";

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto">
      {/* Professional Header with Breadcrumb Feel */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href="/vendors">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{vendor.storeName}</h1>
              <VendorStatusBadge status={vendor.status} />
            </div>
            <p className="text-sm text-gray-500">Vendor ID: <span className="font-mono">{vendor.id}</span></p>
          </div>
        </div>
        <Link href={`/vendors/${id}/edit`}>
          <Button className="gap-2 shadow-sm">
            <Edit className="h-4 w-4" />
            Edit Details
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Content Area - 8 columns */}
        <div className="xl:col-span-8 space-y-6">
          {/* Store & Contact Info Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Information */}
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <Store className="h-4.5 w-4.5 text-white" />
                  </div>
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Name</p>
                  <p className="text-base font-semibold text-gray-900">{vendor.storeName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Name</p>
                  <p className="text-base font-medium text-gray-700">{vendor.ownerName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Phone</p>
                  <p className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {vendor.phone}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registered On</p>
                  <p className="text-sm text-gray-600">{formatDate(vendor.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Address & Location */}
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                    <Building2 className="h-4.5 w-4.5 text-white" />
                  </div>
                  Address & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.storeAddress ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Address</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{vendor.storeAddress}</p>
                  </div>
                ) : (
                  <div className="py-6 text-center bg-gray-50 rounded-lg">
                    <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No address provided</p>
                  </div>
                )}
                {vendor.pincode && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</p>
                    <p className="text-base font-semibold text-gray-900 font-mono">{vendor.pincode}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Latitude</p>
                    <p className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{vendor.latitude}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Longitude</p>
                    <p className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{vendor.longitude}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Areas & Bank Details Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Areas */}
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <MapPinned className="h-4.5 w-4.5 text-white" />
                  </div>
                  Service Areas
                </CardTitle>
                <CardDescription className="text-xs mt-1.5">
                  Delivery pincodes serviced by this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vendor.serviceAreas && vendor.serviceAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vendor.serviceAreas.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-gray-50 rounded-lg">
                    <MapPinned className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No service areas configured</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                    <CreditCard className="h-4.5 w-4.5 text-white" />
                  </div>
                  Bank Details
                </CardTitle>
                <CardDescription className="text-xs mt-1.5">
                  KYC & Payment Settlement Information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vendor.bankDetails ? (
                  <div className="space-y-3">
                    {vendor.bankDetails.accountHolderName && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Holder</p>
                        <p className="text-sm font-medium text-gray-900">{vendor.bankDetails.accountHolderName}</p>
                      </div>
                    )}
                    {vendor.bankDetails.accountNumber && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Number</p>
                        <p className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">{vendor.bankDetails.accountNumber}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {vendor.bankDetails.ifscCode && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IFSC</p>
                          <p className="font-mono text-sm text-gray-700">{vendor.bankDetails.ifscCode}</p>
                        </div>
                      )}
                      {vendor.bankDetails.bankName && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank</p>
                          <p className="text-sm text-gray-700">{vendor.bankDetails.bankName}</p>
                        </div>
                      )}
                    </div>
                    {vendor.bankDetails.branchName && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</p>
                        <p className="text-sm text-gray-700">{vendor.bankDetails.branchName}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-gray-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No bank details provided</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Account Information */}
          {vendor.user && (
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-sm">
                    <User className="h-4.5 w-4.5 text-white" />
                  </div>
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium text-gray-700">{vendor.user.phoneNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</p>
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded capitalize">
                      {vendor.user.role}
                    </span>
                  </div>
                  {vendor.user.name && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p>
                      <p className="text-sm font-medium text-gray-700">{vendor.user.name}</p>
                    </div>
                  )}
                  {vendor.user.email && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-gray-700">{vendor.user.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 4 columns */}
        <div className="xl:col-span-4 space-y-5">
          {/* Approval Actions */}
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Approval Status</CardTitle>
              <CardDescription className="text-xs">
                Vendor verification & approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {isPending ? (
                <>
                  <Button
                    onClick={() => setShowApproveDialog(true)}
                    disabled={approveMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 shadow-sm font-medium"
                    size="sm"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Vendor
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 font-medium"
                    size="sm"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                  </Button>
                </>
              ) : (
                <div className="text-center py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">Current Status</p>
                  <p className="text-sm font-bold capitalize text-gray-900">{vendor.status}</p>
                  {vendor.status === "rejected" && (
                    <Button
                      onClick={() => setShowApproveDialog(true)}
                      disabled={approveMutation.isPending}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Anyway
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card className="shadow-sm border-l-4 border-l-orange-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Access Control</CardTitle>
              <CardDescription className="text-xs">
                Manage vendor system access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendor.status === "blocked" ? (
                <Button
                  onClick={() => unblockMutation.mutate()}
                  disabled={unblockMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 shadow-sm font-medium"
                  size="sm"
                >
                  {unblockMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Restore Access
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => blockMutation.mutate()}
                  disabled={blockMutation.isPending}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 font-medium"
                  size="sm"
                >
                  {blockMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Block Access
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className="shadow-sm border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Admin Notes</CardTitle>
                  <CardDescription className="text-xs">
                    Internal notes history & remarks
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNotes(!editingNotes);
                    if (!editingNotes) setAdminNotesInput("");
                  }}
                  className="text-xs"
                >
                  {editingNotes ? (
                    <>Cancel</>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes && (
                <div className="space-y-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Textarea
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Add a new internal note..."
                    className="min-h-[100px] text-sm bg-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (adminNotesInput.trim()) {
                          updateNotesMutation.mutate(adminNotesInput);
                        }
                      }}
                      disabled={updateNotesMutation.isPending || !adminNotesInput.trim()}
                      className="flex-1"
                    >
                      {updateNotesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Add Note
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingNotes(false);
                        setAdminNotesInput("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {vendor.adminNotes && vendor.adminNotes.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {[...vendor.adminNotes].reverse().map((noteObj: AdminNote, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-3 border-l-2 border-purple-200 last:border-l-transparent last:pb-0">
                      {/* Timeline dot */}
                      <div className="absolute left-0 -translate-x-1/2 top-1.5 w-3 h-3 rounded-full bg-purple-600 ring-4 ring-white"></div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {noteObj.action === 'approved' ? (
                              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              </div>
                            ) : noteObj.action === 'rejected' ? (
                              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                                <FileText className="h-3.5 w-3.5 text-purple-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {noteObj.action && noteObj.action !== 'note_added' && (
                              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${
                                noteObj.action === 'approved' ? 'bg-green-100 text-green-700' :
                                noteObj.action === 'rejected' ? 'bg-red-100 text-red-700' :
                                noteObj.action === 'blocked' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {noteObj.action.charAt(0).toUpperCase() + noteObj.action.slice(1)}
                              </span>
                            )}
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {noteObj.note}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <svg className="h-3 w-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs text-purple-600 font-medium">
                                {formatDate(noteObj.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">No notes added yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingNotes(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add First Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card className="shadow-sm border-l-4 border-l-indigo-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Required Documents</CardTitle>
              <CardDescription className="text-xs">
                Track vendor document submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendor.requiredDocuments && vendor.requiredDocuments.length > 0 ? (
                <div className="space-y-2">
                  {vendor.requiredDocuments.map((doc: RequiredDocument, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        {doc.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{doc.note}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          doc.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "submitted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">No documents required</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newDoc: RequiredDocument = {
                        name: "Business License",
                        status: "pending",
                      };
                      updateDocumentsMutation.mutate([newDoc]);
                    }}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Actions - Collapsible */}
          <Collapsible
            open={showAdvancedActions}
            onOpenChange={setShowAdvancedActions}
            className="w-full"
          >
            <Card className="shadow-sm bg-gray-50 border-gray-200">
              <CollapsibleTrigger asChild>
                <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors rounded-t-lg group">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-gray-400 group-hover:bg-gray-600 transition-colors" />
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                      Advanced Actions
                    </span>
                  </div>
                  {showAdvancedActions ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  )}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-2 pb-4 space-y-3 border-t border-gray-200">
                  {/* Document Link */}
                  {vendor.documentUrl && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white transition-colors group">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 font-medium transition-colors">Business Document</span>
                      </div>
                      <a
                        href={vendor.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                      >
                        View →
                      </a>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wider">Danger Zone</span>
                    </div>
                  </div>

                  {/* Delete Vendor */}
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm h-9 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-colors"
                  >
                    <Trash2 className="mr-2.5 h-4 w-4" />
                    Delete Vendor Permanently
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold text-gray-900">{vendor.storeName}</span> and remove
              all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 font-medium"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Vendor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Vendor Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Vendor</DialogTitle>
            <DialogDescription>
              Approve <span className="font-semibold">{vendor.storeName}</span> to activate their account.
              You can add notes about the approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add notes about this approval..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setApprovalNotes("");
              }}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Vendor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Vendor Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Reject the application from <span className="font-semibold">{vendor.storeName}</span>.
              Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-notes">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection-notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionNotes("");
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              variant="destructive"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
