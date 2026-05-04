"use client";

import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { OrderTracker } from "./order-tracker";
import { ReviewModal } from "./review-modal";

const STATUS_TOASTS: Partial<Record<string, string>> = {
  confirmed: "Pedido confirmado por el comercio",
  preparing: "Tu pedido está en preparación",
  ready: "Tu pedido está listo para ser retirado",
  picked_up: "Tu repartidor está en camino",
  delivered: "Pedido entregado",
  cancelled: "Tu pedido fue cancelado",
  rejected: "Tu pedido fue rechazado por el comercio",
};

type Props = {
  orderId: string;
  storeId: string;
  initialHasReview: boolean;
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

export function OrderTrackerLive({
  orderId,
  storeId,
  initialHasReview,
  initial,
}: Props) {
  const order = useOrderRealtime(orderId, initial);
  const prevStatusRef = useRef<string | null>(null);
  const [hasReview, setHasReview] = useState(initialHasReview);

  useEffect(() => {
    if (prevStatusRef.current === null) {
      prevStatusRef.current = order.status;
      return;
    }
    if (prevStatusRef.current !== order.status) {
      prevStatusRef.current = order.status;
      const msg = STATUS_TOASTS[order.status];
      if (msg) toast(msg);
    }
  }, [order.status]);

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

      {order.status === "delivered" && !hasReview && (
        <ReviewModal
          orderId={orderId}
          storeId={storeId}
          driverId={order.driver_id}
          onReviewed={() => setHasReview(true)}
        />
      )}
    </div>
  );
}
