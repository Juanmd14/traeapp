"use client";

import { Check, Clock, ChefHat, CheckCircle2, Bike, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected";

const STEPS = [
  { id: "confirmed",  label: "Confirmado",     icon: CheckCircle2, statuses: ["confirmed", "preparing", "ready", "picked_up", "delivered", "completed"] },
  { id: "preparing",  label: "Preparando",     icon: ChefHat,       statuses: ["preparing", "ready", "picked_up", "delivered", "completed"] },
  { id: "ready",      label: "Listo",          icon: PackageCheck,  statuses: ["ready", "picked_up", "delivered", "completed"] },
  { id: "picked_up",  label: "En camino",      icon: Bike,          statuses: ["picked_up", "delivered", "completed"] },
  { id: "delivered",  label: "Entregado",      icon: Check,         statuses: ["delivered", "completed"] },
];

type Props = {
  status: OrderStatus;
};

export function OrderTracker({ status }: Props) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg p-4 text-center">
        <p className="text-heading-sm font-semibold text-red-900 dark:text-red-200">
          {status === "cancelled" ? "Pedido cancelado" : "Pedido rechazado"}
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-center">
        <Clock className="size-8 text-warning-600 mx-auto mb-2" />
        <p className="text-heading-sm font-semibold text-warning-900">
          Esperando confirmación
        </p>
        <p className="text-body-sm text-warning-700 mt-1">
          El comercio está revisando tu pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const isCompleted = step.statuses.includes(status);
          const isCurrent =
            (status === "confirmed" && step.id === "confirmed") ||
            (status === "preparing" && step.id === "preparing") ||
            (status === "ready" && step.id === "ready") ||
            (status === "picked_up" && step.id === "picked_up") ||
            (status === "delivered" && step.id === "delivered");

          const Icon = step.icon;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step.id} className="flex items-center gap-3 relative">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[19px] top-10 w-0.5 h-3",
                    isCompleted ? "bg-primary-600" : "bg-neutral-200",
                  )}
                />
              )}
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center shrink-0 transition",
                  isCompleted
                    ? "bg-primary-600 text-white"
                    : isCurrent
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600 animate-pulse-soft"
                      : "bg-neutral-100 text-neutral-400",
                )}
              >
                <Icon className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p
                  className={cn(
                    "text-body-md",
                    isCurrent ? "font-semibold text-neutral-900" : "font-medium text-neutral-700",
                    !isCompleted && !isCurrent && "text-neutral-400",
                  )}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
