"use client";

import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { OrderTracker } from "./order-tracker";

type Props = {
  orderId: string;
  initial: {
    status: any;
    payment_status: string;
    estimated_delivery_at: string | null;
    driver_id: string | null;
    confirmed_at: string | null;
    ready_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
  };
};

export function OrderTrackerLive({ orderId, initial }: Props) {
  const order = useOrderRealtime(orderId, initial);

  return (
    <div className="space-y-4">
      <OrderTracker status={order.status} />

      {order.estimated_delivery_at && order.status !== "delivered" && (
        <div className="bg-neutral-100 rounded-md p-3 text-center">
          <p className="text-body-xs text-neutral-500 uppercase tracking-wider">
            Llegada estimada
          </p>
          <p className="text-heading-sm font-semibold text-neutral-900 mt-0.5">
            {new Date(order.estimated_delivery_at).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
