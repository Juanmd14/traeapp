"use client";

import { useState, useTransition, useEffect } from "react";
import { ChevronDown, Banknote, CreditCard, Clock, MapPin } from "lucide-react";
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

export function KdsOrderCard({ order, items, variant }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(
        Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000),
      );
    }, 30_000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const onAccept = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await acceptOrderAction({ orderId: order.id });
      if (result?.serverError) setServerError(result.serverError);
    });
  };

  const onMarkReady = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await markOrderReadyAction({ orderId: order.id });
      if (result?.serverError) setServerError(result.serverError);
    });
  };

  const onReject = () => {
    const reason = rejectReason === "Otro" ? customReason.trim() : rejectReason;
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
    });
  };

  const variantClasses = {
    new: "bg-primary-50 border-primary-200",
    preparing: "bg-warning-50 border-warning-200",
    ready: "bg-accent-50 border-accent-200",
  };

  const isMpApproved =
    order.payment_method === "mercadopago" && order.payment_status === "approved";

  return (
    <>
      <article
        className={cn(
          "border rounded-lg p-3 sm:p-4 space-y-3",
          variantClasses[variant],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-body-md font-bold text-neutral-900">
              #{order.order_number}
            </p>
            <p className="text-body-xs text-neutral-500 flex items-center gap-1">
              <Clock className="size-3" />
              {elapsed === 0 ? "recién" : `${elapsed} min`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-body-md font-bold text-neutral-900">
              {formatPrice(order.total)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                order.payment_method === "cash"
                  ? "bg-accent-100 text-accent-800"
                  : isMpApproved
                    ? "bg-blue-100 text-blue-800"
                    : "bg-warning-100 text-warning-800",
              )}
            >
              {order.payment_method === "cash" ? (
                <>
                  <Banknote className="size-2.5" /> Efectivo
                </>
              ) : (
                <>
                  <CreditCard className="size-2.5" />
                  {isMpApproved ? "MP pagado" : "MP pendiente"}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Items resumen */}
        {items && items.length > 0 && (
          <div className="text-body-sm text-neutral-700">
            {expanded ? (
              <ul className="space-y-1">
                {items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-2">
                    <span>
                      <span className="font-semibold">{it.quantity}×</span>{" "}
                      {it.product_name}
                      {it.notes && (
                        <span className="block text-body-xs text-neutral-500 italic ml-4">
                          “{it.notes}”
                        </span>
                      )}
                    </span>
                    <span className="text-neutral-500 shrink-0">
                      {formatPrice(it.total)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="line-clamp-2">
                {items
                  .map((it) => `${it.quantity}× ${it.product_name}`)
                  .join(" · ")}
              </p>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-body-xs font-medium text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-0.5 transition"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  expanded && "rotate-180",
                )}
              />
              {expanded ? "Cerrar" : "Ver detalle"}
            </button>
          </div>
        )}

        {/* Dirección y notas */}
        {expanded && (
          <div className="border-t border-neutral-200/70 pt-2 space-y-1.5">
            <p className="text-body-xs text-neutral-500 uppercase tracking-wider">
              Entrega
            </p>
            <p className="text-body-sm text-neutral-700 flex items-start gap-1.5">
              <MapPin className="size-3.5 text-neutral-400 mt-0.5 shrink-0" />
              {order.delivery_address_text}
            </p>
            {order.customer_notes && (
              <p className="text-body-sm text-neutral-600 italic">
                Nota: {order.customer_notes}
              </p>
            )}
          </div>
        )}

        {serverError && (
          <p className="text-body-xs text-destructive bg-red-50 px-2 py-1 rounded-md">
            {serverError}
          </p>
        )}

        {/* Acciones */}
        {variant === "new" && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setRejectOpen(true)}
              disabled={isPending}
            >
              Rechazar
            </Button>
            <Button
              variant="default"
              size="sm"
              fullWidth
              onClick={onAccept}
              loading={isPending}
            >
              Aceptar
            </Button>
          </div>
        )}

        {variant === "preparing" && (
          <Button
            variant="dark"
            size="sm"
            fullWidth
            onClick={onMarkReady}
            loading={isPending}
          >
            Marcar listo
          </Button>
        )}

        {variant === "ready" && (
          <p className="text-body-xs text-accent-700 text-center font-medium">
            Esperando que retire el repartidor
          </p>
        )}
      </article>

      {/* Modal de rechazo */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Por qué rechazás este pedido?</DialogTitle>
            <DialogDescription>
              El cliente va a recibir tu motivo. Si pagó con Mercado Pago, se le
              reintegra automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {REJECT_REASONS.map((r) => (
              <label
                key={r}
                className={cn(
                  "flex items-center gap-3 p-3 border-2 rounded-md cursor-pointer transition-all",
                  rejectReason === r
                    ? "border-accent-500 bg-accent-50 ring-2 ring-accent-100"
                    : "border-neutral-200 hover:border-neutral-300",
                )}
              >
                <input
                  type="radio"
                  name="rejectReason"
                  value={r}
                  checked={rejectReason === r}
                  onChange={() => setRejectReason(r)}
                  className="accent-accent-600"
                />
                <span className="text-body-md">{r}</span>
              </label>
            ))}

            {rejectReason === "Otro" && (
              <Input
                placeholder="Escribí el motivo..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                maxLength={200}
                className="mt-2"
              />
            )}

            {serverError && (
              <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">
                {serverError}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="ghost" fullWidth>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              fullWidth
              onClick={onReject}
              loading={isPending}
            >
              Confirmar rechazo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}