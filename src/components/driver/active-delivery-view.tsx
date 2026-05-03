"use client";

import { useState } from "react";
import { MapPin, Store, Package, CheckCircle2, Truck, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { advanceDeliveryAction } from "@/server/actions/driver";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { cn } from "@/lib/utils";

type DeliveryStatus = "assigned" | "heading_to_store" | "at_store" | "heading_to_customer" | "delivered" | "failed";

type ActiveDeliveryData = {
  deliveryId: string;
  status: DeliveryStatus;
  orderId: string;
  orderNumber: number;
  storeName: string;
  storeAddress: string;
  deliveryAddress: string;
  customerName: string;
  total: number;
  deliveryFee: number;
  itemsCount: number;
  customerNotes: string | null;
};

const STEPS: { status: DeliveryStatus; label: string; icon: React.ElementType }[] = [
  { status: "assigned", label: "Asignado", icon: CheckCircle2 },
  { status: "heading_to_store", label: "Yendo al comercio", icon: Navigation },
  { status: "at_store", label: "En el comercio", icon: Store },
  { status: "heading_to_customer", label: "En camino", icon: Truck },
  { status: "delivered", label: "Entregado", icon: CheckCircle2 },
];

const STATUS_INDEX: Record<DeliveryStatus, number> = {
  assigned: 0,
  heading_to_store: 1,
  at_store: 2,
  heading_to_customer: 3,
  delivered: 4,
  failed: -1,
};

const NEXT_BUTTON_LABEL: Partial<Record<DeliveryStatus, string>> = {
  assigned: "Voy al comercio",
  heading_to_store: "Llegué al comercio",
  at_store: "Tomé el pedido",
  heading_to_customer: "Entregué el pedido",
};

const INSTRUCTION: Partial<Record<DeliveryStatus, (d: ActiveDeliveryData) => string>> = {
  assigned: (d) => `Dirigite a ${d.storeName}`,
  heading_to_store: (d) => `En camino a ${d.storeName}`,
  at_store: (d) => `Retirá el pedido #${d.orderNumber} en ${d.storeName}`,
  heading_to_customer: (d) => `Entregá en ${d.deliveryAddress}`,
  delivered: () => "¡Pedido entregado! Bien hecho.",
};

export function ActiveDeliveryView({ data: initialData }: { data: ActiveDeliveryData }) {
  const [status, setStatus] = useState<DeliveryStatus>(initialData.status);
  const currentIndex = STATUS_INDEX[status];
  const isActive = status !== "delivered" && status !== "failed";

  useDriverLocation(initialData.deliveryId, isActive);

  const { execute, isPending } = useAction(advanceDeliveryAction, {
    onSuccess: ({ data }) => {
      if (data?.newStatus) {
        setStatus(data.newStatus as DeliveryStatus);
        if (data.newStatus === "delivered") {
          toast.success("¡Pedido entregado! Gracias por tu trabajo.");
        }
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Error al avanzar el estado");
    },
  });

  const instruction = INSTRUCTION[status]?.(initialData);
  const nextLabel = NEXT_BUTTON_LABEL[status];

  return (
    <div className="flex flex-col gap-4">
      {/* Instrucción principal */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className={cn(
            "size-10 rounded-xl flex items-center justify-center",
            status === "delivered" ? "bg-green-100" : "bg-primary/10"
          )}>
            {status === "delivered"
              ? <CheckCircle2 className="size-5 text-green-600" />
              : status === "heading_to_customer" || status === "at_store"
              ? <Truck className="size-5 text-primary" />
              : <Navigation className="size-5 text-primary" />
            }
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">
              Pedido #{initialData.orderNumber}
            </p>
            <p className="font-semibold text-neutral-900">{instruction}</p>
          </div>
        </div>
      </div>

      {/* Pasos */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Progreso</p>
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const Icon = step.icon;
            return (
              <div key={step.status} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "size-7 rounded-full flex items-center justify-center border-2 transition-all",
                    done && "bg-primary border-primary",
                    active && "bg-white border-primary",
                    !done && !active && "bg-white border-neutral-200",
                  )}>
                    <Icon className={cn(
                      "size-3.5",
                      done && "text-white",
                      active && "text-primary",
                      !done && !active && "text-neutral-300",
                    )} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "w-px h-6 transition-all",
                      done ? "bg-primary" : "bg-neutral-200"
                    )} />
                  )}
                </div>
                <span className={cn(
                  "text-sm pb-6",
                  done && "text-neutral-500 line-through",
                  active && "text-neutral-900 font-semibold",
                  !done && !active && "text-neutral-400",
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ruta */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 size-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
            <Store className="size-2.5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Comercio (origen)</p>
            <p className="text-sm text-neutral-800">{initialData.storeName}</p>
            <p className="text-xs text-neutral-500">{initialData.storeAddress}</p>
          </div>
        </div>
        <div className="ml-[9px] w-px h-4 bg-neutral-300" />
        <div className="flex items-start gap-3">
          <MapPin className="size-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-neutral-500 font-medium">Cliente (destino)</p>
            <p className="text-sm text-neutral-800">{initialData.customerName}</p>
            <p className="text-xs text-neutral-500">{initialData.deliveryAddress}</p>
          </div>
        </div>
        {initialData.customerNotes && (
          <div className="mt-1 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700 font-medium">Nota del cliente</p>
            <p className="text-xs text-amber-600 mt-0.5">{initialData.customerNotes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Package className="size-4 text-neutral-400" />
          <span>{initialData.itemsCount} {initialData.itemsCount === 1 ? "ítem" : "ítems"}</span>
          <span className="mx-2 text-neutral-300">·</span>
          <span className="font-semibold text-green-600">+${initialData.deliveryFee.toLocaleString("es-AR")}</span>
          <span className="text-neutral-400">tu ganancia</span>
        </div>
      </div>

      {/* Botón de avance */}
      {nextLabel && (
        <button
          onClick={() => execute({ deliveryId: initialData.deliveryId })}
          disabled={isPending}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition active:scale-[0.98]",
            status === "heading_to_customer"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground",
            isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          {isPending ? (
            <span className="size-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            nextLabel
          )}
        </button>
      )}

      {status === "delivered" && (
        <div className="text-center py-4">
          <p className="text-lg font-bold text-green-600">¡Entrega completada!</p>
          <p className="text-sm text-neutral-500 mt-1">Ganaste ${initialData.deliveryFee.toLocaleString("es-AR")} en este pedido</p>
        </div>
      )}
    </div>
  );
}
