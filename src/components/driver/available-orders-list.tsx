"use client";

import { PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { AvailableOrderCard } from "./available-order-card";
import { DriverOnlineToggle } from "./driver-online-toggle";
import {
  useAvailableOrdersRealtime,
  type AvailableOrder,
} from "@/hooks/use-available-orders-realtime";
import { useNotificationSound } from "@/hooks/use-notification-sound";

type Props = {
  initialOrders: AvailableOrder[];
  initialOnline: boolean;
};

export function AvailableOrdersList({ initialOrders, initialOnline }: Props) {
  const { play } = useNotificationSound();

  const orders = useAvailableOrdersRealtime(initialOrders, {
    onNewOrder: (order) => {
      play();
      toast.success(`¡Nuevo pedido de ${order.stores.name}!`, {
        description: `#${order.order_number} · +$${order.delivery_fee.toLocaleString("es-AR")} de envío`,
        duration: 8000,
      });
    },
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Pedidos disponibles</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {orders.length === 0
              ? "No hay pedidos listos ahora"
              : `${orders.length} ${orders.length === 1 ? "pedido esperando" : "pedidos esperando"}`}
          </p>
        </div>
        <DriverOnlineToggle initialOnline={initialOnline} />
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <PackageSearch className="size-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium">Sin pedidos listos</p>
          <p className="text-sm text-neutral-400 mt-1">Te avisamos en cuanto haya uno</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <AvailableOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
