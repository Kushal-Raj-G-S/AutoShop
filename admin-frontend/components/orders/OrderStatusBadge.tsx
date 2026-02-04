import { Badge } from "@/components/ui/badge";

type OrderStatus =
  | "pending_payment"
  | "payment_failed"
  | "awaiting_assignment"
  | "assigned"
  | "vendor_accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded";

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending_payment: "outline",
      payment_failed: "destructive",
      awaiting_assignment: "outline",
      assigned: "secondary",
      vendor_accepted: "default",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive",
      refunded: "secondary",
    };

    return statusMap[status] || "outline";
  };

  const getLabel = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Badge variant={getVariant(status)} className="text-xs">
      {getLabel(status)}
    </Badge>
  );
}
