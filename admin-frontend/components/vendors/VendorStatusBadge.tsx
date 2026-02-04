import { Badge } from "@/components/ui/badge";
import { type VendorStatus } from "@/lib/api/vendors";

interface VendorStatusBadgeProps {
  status: VendorStatus;
}

export function VendorStatusBadge({ status }: VendorStatusBadgeProps) {
  const variants: Record<VendorStatus, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    approved: "default",
    rejected: "destructive",
  };

  const colors: Record<VendorStatus, string> = {
    pending: "text-yellow-700 border-yellow-300 bg-yellow-50",
    approved: "text-green-700 border-green-300 bg-green-50",
    rejected: "text-red-700 border-red-300 bg-red-50",
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
