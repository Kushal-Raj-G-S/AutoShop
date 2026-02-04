import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VendorStatusBadge } from "./VendorStatusBadge";
import { type Vendor } from "@/lib/api/vendors";
import { Eye } from "lucide-react";

interface VendorsTableProps {
  vendors: Vendor[];
}

export function VendorsTable({ vendors }: VendorsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No vendors found</p>
        <p className="text-sm mt-1">Vendors will appear here once they register</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Store Name</TableHead>
            <TableHead>Owner Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell className="font-medium">{vendor.storeName}</TableCell>
              <TableCell>{vendor.ownerName}</TableCell>
              <TableCell>{vendor.phone}</TableCell>
              <TableCell>
                <VendorStatusBadge status={vendor.status} />
              </TableCell>
              <TableCell>{formatDate(vendor.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Link href={`/vendors/${vendor.id}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
