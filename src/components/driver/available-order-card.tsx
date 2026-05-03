"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Store, Package, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { claimOrderAction } from "@/server/actions/driver";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type AvailableOrder = {
  id: string;
  order_number: number;
  total: number;
  delivery_fee: number;
  delivery_address_text: string;
  ready_at: string | null;
  items_count: number;
  stores: {
    name: string;
    address: string;
  };
};

export function AvailableOrderCard({ order }: { order: AvailableOrder }) {
  const router = useRouter();
  const [claimed, setClaimed] = useState(false);

  const { execute, isPending } = useAction(claimOrderAction, {
    onSuccess: () => {
      setClaimed(true);
      toast.success("¡Pedido tomado! Dirigite al comercio.");
      router.push("/driver/activo");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "No se pudo tomar el pedido");
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header — tienda + número */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 truncate">{order.stores.name}</p>
            <p className="text-xs text-neutral-500 truncate">{order.stores.address}</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
          #{order.order_number}
        </span>
      </div>

      {/* Ruta */}
      <div className="px-4 py-3 border-t border-neutral-100 space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 size-4 rounded-full border-2 border-primary shrink-0" />
          <p className="text-sm text-neutral-700 leading-snug">{order.stores.address}</p>
        </div>
        <div className="ml-[7px] w-px h-3 bg-neutral-300" />
        <div className="flex items-start gap-2">
          <MapPin className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-700 leading-snug">{order.delivery_address_text}</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="px-4 py-3 border-t border-neutral-100 flex items-center gap-4 text-sm text-neutral-600">
        <div className="flex items-center gap-1.5">
          <Package className="size-3.5 text-neutral-400" />
          <span>{order.items_count} {order.items_count === 1 ? "ítem" : "ítems"}</span>
        </div>
        {order.ready_at && (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-neutral-400" />
            <span>Listo {formatDistanceToNow(new Date(order.ready_at), { addSuffix: true, locale: es })}</span>
          </div>
        )}
        <div className="ml-auto font-semibold text-green-600">
          +${order.delivery_fee.toLocaleString("es-AR")}
        </div>
      </div>

      {/* Acción */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={() => execute({ orderId: order.id })}
          disabled={isPending || claimed}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Tomar pedido
              <ChevronRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
