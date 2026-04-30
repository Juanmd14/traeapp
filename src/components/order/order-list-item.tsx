import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready"
  | "picked_up" | "delivered" | "completed" | "cancelled" | "rejected";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Esperando confirmación",
  confirmed: "Confirmado",
  preparing: "En preparación",
  ready: "Listo para retirar",
  picked_up: "En camino",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
  rejected: "Rechazado",
};

const STATUS_ICONS: Record<OrderStatus, { icon: typeof Clock; bgClass: string; textClass: string }> = {
  pending:    { icon: Clock,        bgClass: "bg-warning-100", textClass: "text-warning-800" },
  confirmed:  { icon: CheckCircle2, bgClass: "bg-primary-100", textClass: "text-primary-700" },
  preparing:  { icon: Clock,        bgClass: "bg-primary-100", textClass: "text-primary-700" },
  ready:      { icon: CheckCircle2, bgClass: "bg-primary-100", textClass: "text-primary-700" },
  picked_up:  { icon: Clock,        bgClass: "bg-primary-100", textClass: "text-primary-700" },
  delivered:  { icon: CheckCircle2, bgClass: "bg-accent-100",  textClass: "text-accent-700" },
  completed:  { icon: CheckCircle2, bgClass: "bg-accent-100",  textClass: "text-accent-700" },
  cancelled:  { icon: XCircle,      bgClass: "bg-red-100",     textClass: "text-red-700" },
  rejected:   { icon: XCircle,      bgClass: "bg-red-100",     textClass: "text-red-700" },
};

type Props = {
  order: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    total: number;
    createdAt: string;
    storeName: string;
    itemCount: number;
  };
};

export function OrderListItem({ order }: Props) {
  const status = STATUS_ICONS[order.status];
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/pedido/${order.id}`}
      className="block bg-white border border-neutral-200 rounded-md p-4 hover:bg-neutral-50 active:scale-[0.99] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-body-xs text-neutral-500">
            #{order.orderNumber} ·{" "}
            {new Date(order.createdAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <h3 className="text-body-md font-medium text-neutral-900 mt-0.5 truncate">
            {order.storeName}
          </h3>
          <p className="text-body-sm text-neutral-500 mt-0.5">
            {order.itemCount} {order.itemCount === 1 ? "producto" : "productos"} ·{" "}
            <span className="font-medium text-neutral-900">{formatPrice(order.total)}</span>
          </p>

          <div className="flex items-center gap-1.5 mt-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-body-xs font-medium px-2 py-0.5 rounded-full",
                status.bgClass,
                status.textClass,
              )}
            >
              <StatusIcon className="size-3" />
              {STATUS_LABELS[order.status]}
            </span>
          </div>
        </div>
        <ChevronRight className="size-5 text-neutral-400 shrink-0 mt-1" />
      </div>
    </Link>
  );
}