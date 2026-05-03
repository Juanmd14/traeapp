"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Banknote, CreditCard, Clock, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, cn } from "@/lib/utils";
import {
  acceptOrderAction,
  rejectOrderAction,
  markOrderReadyAction,
} from "@/server/actions/orders";

import type { StoreOrderRow } from "@/hooks/use-store-orders";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  total: number;
  notes: string | null;
};

type Props = {
  order: StoreOrderRow;
  items?: OrderItem[];
  variant: "new" | "preparing" | "ready";
};

const REJECT_REASONS = [
  "Stock agotado",
  "Local cerrado o sin atención",
  "Demora excesiva",
  "Dirección fuera de zona",
  "Otro",
];

const TIME_WARNING_MINUTES = 10;
const TIME_CRITICAL_MINUTES = 20;

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function getTimeColor(minutes: number): string {
  if (minutes >= TIME_CRITICAL_MINUTES) return "text-red-600 bg-red-50";
  if (minutes >= TIME_WARNING_MINUTES) return "text-amber-600 bg-amber-50";
  return "text-neutral-600 bg-neutral-50";
}

function getTimeIcon(minutes: number) {
  if (minutes >= TIME_CRITICAL_MINUTES) return <AlertTriangle className="size-4" />;
  return <Clock className="size-4" />;
}

export function KdsOrderCard({ order, items, variant }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [elapsed, setElapsed] = useState(0);

  // Timer actualizado cada 10 segundos
  useEffect(() => {
    const updateElapsed = () => {
      const now = Date.now();
      const startTime = order.status === "preparing" 
        ? new Date(order.confirmed_at ?? order.created_at).getTime()
        : new Date(order.created_at).getTime();
      setElapsed(Math.floor((now - startTime) / 60000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 10000);
    return () => clearInterval(interval);
  }, [order.created_at, order.confirmed_at, order.status]);

  const isWarning = elapsed >= TIME_WARNING_MINUTES;
  const isCritical = elapsed >= TIME_CRITICAL_MINUTES;

  const onAccept = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await acceptOrderAction({ orderId: order.id });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const onMarkReady = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await markOrderReadyAction({ orderId: order.id });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const onReject = () => {
    const reason =
      (rejectReason === "Otro" ? customReason.trim() : rejectReason) ?? "";
    if (reason.length < 3) {
      setServerError("Indicá un motivo");
      return;
    }
    startTransition(async () => {
      const result = await rejectOrderAction({ orderId: order.id, reason });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setRejectOpen(false);
      router.refresh();
    });
  };

  const statusColor = {
    new: "border-l-primary-500",
    preparing: "border-l-warning-500",
    ready: "border-l-accent-500",
  };

  const statusBg = {
    new: "bg-primary-500",
    preparing: "bg-warning-500",
    ready: "bg-accent-500",
  };

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-lg border border-neutral-200 border-l-4 shadow-sm",
          statusColor[variant],
          isPending && "opacity-50"
        )}
      >
        <div className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-heading-sm font-bold text-neutral-900">
                #{order.order_number}
              </p>
              <p className="text-body-xs text-neutral-500">
                {new Date(order.created_at).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            
            {/* Timer */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-body-sm font-medium",
              getTimeColor(elapsed)
            )}>
              {getTimeIcon(elapsed)}
              <span>{formatElapsed(elapsed)}</span>
            </div>
          </div>

          {/* Items summary */}
          <div className="text-body-sm text-neutral-700 mb-3">
            {items?.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="truncate">{item.quantity}x {item.product_name}</span>
              </div>
            ))}
            {(items?.length ?? 0) > 3 && (
              <p className="text-neutral-400 text-body-xs">+{items!.length - 3} más</p>
            )}
          </div>

          {/* Payment method */}
          <div className="flex items-center gap-2 mb-3">
            {order.payment_method === "cash" ? (
              <span className="inline-flex items-center gap-1 text-body-xs text-neutral-600">
                <Banknote className="size-3.5" />
                Efectivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-body-xs text-neutral-600">
                <CreditCard className="size-3.5" />
                MercadoPago {order.payment_status === "pending" && "(pendiente)"}
              </span>
            )}
            {order.customer_notes && (
              <span className="text-body-xs text-amber-600 flex items-center gap-1">
                <MapPin className="size-3" />
                Con nota
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {variant === "new" && (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={onAccept}
                  loading={isPending}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                >
                  X
                </Button>
              </>
            )}
            {variant === "preparing" && (
              <Button
                size="sm"
                className="w-full"
                variant="success"
                onClick={onMarkReady}
                loading={isPending}
              >
                <CheckCircle className="size-4" />
                Listo
              </Button>
            )}
            {variant === "ready" && (
              <div className="w-full text-center text-body-sm text-accent-600 font-medium py-2">
                Esperando repartidor
              </div>
            )}
          </div>

          {/* Expand toggle */}
          {items && items.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-2 flex items-center justify-center gap-1 text-body-xs text-neutral-500 hover:text-neutral-700"
            >
              <span>{expanded ? "Ocultar" : "Ver"} detalles</span>
              <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Expanded details */}
        {expanded && items && (
          <div className="px-3 sm:px-4 pb-3 border-t border-neutral-100 pt-3 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-body-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-neutral-900">{item.quantity}x</span>
                  <span className="text-neutral-700">{item.product_name}</span>
                </div>
                {item.notes && (
                  <span className="text-body-xs text-amber-600 italic">"{item.notes}"</span>
                )}
              </div>
            ))}
            {order.customer_notes && (
              <div className="mt-2 p-2 bg-amber-50 rounded text-body-xs text-amber-800">
                <strong>Nota:</strong> {order.customer_notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pedido #{order.order_number}</DialogTitle>
            <DialogDescription>
              Elegí el motivo por el cual rechazás este pedido.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {REJECT_REASONS.map((reason) => (
              <label
                key={reason}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-md border cursor-pointer transition",
                  rejectReason === reason
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <input
                  type="radio"
                  name="rejectReason"
                  value={reason}
                  checked={rejectReason === reason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="accent-primary-500"
                />
                <span className="text-body-sm">{reason}</span>
              </label>
            ))}

            {rejectReason === "Otro" && (
              <Input
                placeholder="Especificá el motivo..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>

          {serverError && (
            <p className="text-body-sm text-destructive">{serverError}</p>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setRejectOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onReject} loading={isPending} className="flex-1">
              Rechazar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}