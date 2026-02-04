import { CheckCircle2, Circle, XCircle } from "lucide-react";

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

interface TimelineStep {
  status: OrderStatus;
  label: string;
  timestamp?: string;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus | string;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export function OrderTimeline({
  currentStatus,
  createdAt,
  assignedAt,
  acceptedAt,
  startedAt,
  completedAt,
  cancelledAt,
}: OrderTimelineProps) {
  const steps: TimelineStep[] = [
    { status: "pending_payment", label: "Order Created", timestamp: createdAt },
    {
      status: "awaiting_assignment",
      label: "Awaiting Assignment",
      timestamp: createdAt,
    },
    { status: "assigned", label: "Assigned to Vendor", timestamp: assignedAt },
    {
      status: "vendor_accepted",
      label: "Vendor Accepted",
      timestamp: acceptedAt,
    },
    { status: "in_progress", label: "In Progress", timestamp: startedAt },
    { status: "completed", label: "Completed", timestamp: completedAt },
  ];

  // Handle cancelled state
  if (currentStatus === "cancelled" && cancelledAt) {
    return (
      <div className="space-y-4">
        {steps.slice(0, 2).map((step, index) => {
          const isPast = index === 0;
          return (
            <div key={step.status} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                )}
              </div>
              <div className="flex-1 pb-8">
                <p className={`font-medium ${isPast ? "text-gray-900" : "text-gray-400"}`}>
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-sm text-gray-500">
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-600">Order Cancelled</p>
            <p className="text-sm text-gray-500">
              {new Date(cancelledAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusOrder: OrderStatus[] = [
    "pending_payment",
    "awaiting_assignment",
    "assigned",
    "vendor_accepted",
    "in_progress",
    "completed",
  ];

  const currentIndex = statusOrder.indexOf(currentStatus as OrderStatus);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isPast = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {isPast ? (
                <CheckCircle2
                  className={`w-5 h-5 ${isCurrent ? "text-blue-500" : "text-green-500"}`}
                />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 my-1 ${isPast ? "bg-green-500" : "bg-gray-200"}`}
                ></div>
              )}
            </div>
            <div className="flex-1 pb-8">
              <p
                className={`font-medium ${
                  isCurrent
                    ? "text-blue-600"
                    : isPast
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              {step.timestamp && isPast && (
                <p className="text-sm text-gray-500">
                  {new Date(step.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
