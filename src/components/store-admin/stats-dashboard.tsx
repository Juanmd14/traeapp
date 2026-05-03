"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from "lucide-react";

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  avgTicket: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  todayOrders: number;
  todayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
};

type Props = {
  storeId: string;
  initial: Stats;
};

export function StatsDashboard({ storeId, initial }: Props) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  const stats = period === "today" 
    ? { orders: initial.todayOrders, revenue: initial.todayRevenue }
    : period === "week"
    ? { orders: initial.weekOrders, revenue: initial.weekRevenue }
    : { orders: initial.totalOrders, revenue: initial.totalRevenue };

  const avgTicket = stats.orders > 0 ? stats.revenue / stats.orders : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-md font-semibold text-neutral-900">
          Resumen de ventas
        </h2>
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-body-sm transition ${
                period === p
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {p === "today" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <ShoppingBag className="size-4" />
            <span className="text-body-xs">Pedidos</span>
          </div>
          <p className="text-heading-lg font-semibold text-neutral-900">{stats.orders}</p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <DollarSign className="size-4" />
            <span className="text-body-xs">Ingresos</span>
          </div>
          <p className="text-heading-lg font-semibold text-neutral-900">
            ${stats.revenue.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <TrendingUp className="size-4" />
            <span className="text-body-xs">Ticket promedio</span>
          </div>
          <p className="text-heading-lg font-semibold text-neutral-900">
            ${avgTicket.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <Clock className="size-4" />
            <span className="text-body-xs">En proceso</span>
          </div>
          <p className="text-heading-lg font-semibold text-neutral-900">
            {initial.pendingOrders + initial.preparingOrders}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <h3 className="text-heading-sm font-medium text-neutral-900 mb-4">
          Estado de pedidos
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-neutral-600">Pendientes</span>
            <span className="font-medium text-neutral-900">{initial.pendingOrders}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-neutral-600">Preparando</span>
            <span className="font-medium text-neutral-900">{initial.preparingOrders}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-neutral-600">Completados</span>
            <span className="font-medium text-neutral-900">{initial.completedOrders}</span>
          </div>
        </div>
      </div>
    </div>
  );
}