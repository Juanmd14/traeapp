"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Award,
  ChefHat,
} from "lucide-react";

import { formatPrice } from "@/lib/utils";

type ChartPoint = { name: string; pedidos: number; ingresos: number };
type TopProduct = { name: string; revenue: number };

type Stats = {
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  total: { orders: number; revenue: number };
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  chartData: ChartPoint[];
  topProducts: TopProduct[];
  avgRating: number | null;
  reviewCount: number;
};

type Props = {
  storeId: string;
  initial: Stats;
};

export function StatsDashboard({ initial }: Props) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const stats =
    period === "today" ? initial.today :
    period === "week"  ? initial.week  :
    initial.month;

  const avgTicket = stats.orders > 0 ? stats.revenue / stats.orders : 0;
  const activeOrders = initial.pendingOrders + initial.preparingOrders + initial.readyOrders;

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100">Resumen de ventas</h2>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-body-sm transition-all ${
                period === p
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm font-medium"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              {p === "today" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<ShoppingBag className="size-4" />}
          label="Pedidos"
          value={stats.orders.toString()}
          color="red"
        />
        <MetricCard
          icon={<DollarSign className="size-4" />}
          label="Ingresos (ARS)"
          value={formatPrice(stats.revenue)}
          color="green"
        />
        <MetricCard
          icon={<TrendingUp className="size-4" />}
          label="Ticket promedio (ARS)"
          value={formatPrice(avgTicket)}
          color="blue"
        />
        <MetricCard
          icon={<Clock className="size-4" />}
          label="En proceso"
          value={activeOrders.toString()}
          color="amber"
          sublabel={
            activeOrders > 0
              ? `${initial.pendingOrders} pend. · ${initial.readyOrders} listos`
              : "Sin pedidos activos"
          }
        />
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <h3 className="text-heading-sm font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          Pedidos por día — últimos 7 días
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={initial.chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e7e5e4",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              formatter={(value) => [value, "pedidos"]}
              labelStyle={{ fontWeight: 600, color: "#1c1917" }}
              cursor={{ fill: "rgba(255,77,58,0.06)" }}
            />
            <Bar
              dataKey="pedidos"
              fill="#FF4D3A"
              radius={[4, 4, 0, 0]}
              maxBarSize={52}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="size-4 text-warning fill-warning" />
            <h3 className="text-heading-sm font-medium text-neutral-900 dark:text-neutral-100">
              Más vendidos — este mes
            </h3>
          </div>

          {initial.topProducts.length > 0 ? (
            <div className="space-y-3.5">
              {initial.topProducts.map((p, i) => {
                const maxRevenue = initial.topProducts[0]?.revenue ?? 1;
                const pct = Math.round((p.revenue / maxRevenue) * 100);
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-neutral-700 dark:text-neutral-300 truncate flex-1 mr-2">
                        {medal} {p.name}
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 shrink-0 tabular-nums">
                        {formatPrice(p.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <ShoppingBag className="size-8 text-neutral-200 mb-2" />
              <p className="text-body-sm text-neutral-400">Sin ventas este mes todavía</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Rating */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="size-4 text-warning fill-warning" />
              <h3 className="text-heading-sm font-medium text-neutral-900 dark:text-neutral-100">Calificación</h3>
            </div>

            {initial.avgRating !== null ? (
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
                  {initial.avgRating.toFixed(1)}
                </span>
                <div className="pb-0.5">
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`size-3.5 ${
                          star <= Math.round(initial.avgRating!)
                            ? "fill-warning text-warning"
                            : "fill-neutral-200 dark:fill-neutral-700 text-neutral-200 dark:text-neutral-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-body-xs text-neutral-400 dark:text-neutral-500">
                    {initial.reviewCount} {initial.reviewCount === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-body-sm text-neutral-400 dark:text-neutral-500">Sin reseñas todavía</p>
            )}
          </div>

          {/* Active Orders Status */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat className="size-4 text-neutral-500 dark:text-neutral-400" />
              <h3 className="text-heading-sm font-medium text-neutral-900 dark:text-neutral-100">Estado actual</h3>
            </div>
            <div className="space-y-2.5">
              <StatusRow label="Pendientes / Confirmados" value={initial.pendingOrders} color="amber" />
              <StatusRow label="En preparación" value={initial.preparingOrders} color="blue" />
              <StatusRow label="Listos para retiro" value={initial.readyOrders} color="green" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  icon, label, value, color, sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "red" | "green" | "blue" | "amber";
  sublabel?: string;
}) {
  const bg: Record<string, string> = {
    red:   "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300",
    green: "bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-300",
    blue:  "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300",
    amber: "bg-warning/10 dark:bg-warning/20 text-warning-600 dark:text-warning-300",
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${bg[color]}`}>
        {icon}
      </div>
      <p className="text-body-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
      <p className="text-heading-md font-bold text-neutral-900 dark:text-neutral-100 leading-none tabular-nums">
        {value}
      </p>
      {sublabel && (
        <p className="text-body-xs text-neutral-400 dark:text-neutral-500 mt-1">{sublabel}</p>
      )}
    </div>
  );
}

function StatusRow({
  label, value, color,
}: {
  label: string;
  value: number;
  color: "amber" | "blue" | "green";
}) {
  const dot: Record<string, string> = {
    amber: "bg-warning",
    blue:  "bg-blue-400",
    green: "bg-accent",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full shrink-0 ${dot[color]}`} />
        <span className="text-body-sm text-neutral-600 dark:text-neutral-300">{label}</span>
      </div>
      <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-body-sm tabular-nums">{value}</span>
    </div>
  );
}
