import { redirect } from "next/navigation";

import { requireAuth, getUserStores } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StatsDashboard } from "@/components/store-admin/stats-dashboard";

export const metadata = { title: "Estadísticas" };
export const dynamic = "force-dynamic";

export default async function EstadisticasPage() {
  const session = await requireAuth("/login?next=/comercio/estadisticas");
  const stores = await getUserStores(session.id);

  if (stores.length === 0 && session.role !== "admin") {
    redirect("/comercio/onboarding");
  }

  const storeId = stores[0]?.storeId;
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString();

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthStr = monthAgo.toISOString();

  // Últimos 7 días con created_at para el chart
  const { data: weekRawData } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", storeId)
    .gte("created_at", weekStr) as {
      data: { total: number; status: string; created_at: string }[] | null;
    };

  // Último mes completados
  const { data: monthData } = await supabase
    .from("orders")
    .select("total")
    .eq("store_id", storeId)
    .gte("created_at", monthStr)
    .in("status", ["completed", "delivered"]) as {
      data: { total: number }[] | null;
    };

  // Total histórico completados
  const { data: totalData } = await supabase
    .from("orders")
    .select("total")
    .eq("store_id", storeId)
    .in("status", ["completed", "delivered"]) as {
      data: { total: number }[] | null;
    };

  // Pedidos activos por estado
  const { data: activeData } = await supabase
    .from("orders")
    .select("status")
    .eq("store_id", storeId)
    .in("status", ["pending", "confirmed", "preparing", "ready"]) as {
      data: { status: string }[] | null;
    };

  // Top productos del mes (via órdenes completadas del mes)
  const { data: ordersWithItems } = await supabase
    .from("orders")
    .select("order_items(product_name, quantity)")
    .eq("store_id", storeId)
    .in("status", ["completed", "delivered"])
    .gte("created_at", monthStr) as {
      data: { order_items: { product_name: string; quantity: number }[] }[] | null;
    };

  // Rating promedio
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("store_rating")
    .eq("store_id", storeId) as {
      data: { store_rating: number }[] | null;
    };

  // ── Calcular métricas por período ──────────────────────────────────────
  const weekCompleted = weekRawData?.filter(o =>
    ["completed", "delivered"].includes(o.status)
  ) ?? [];

  const todayCompleted = weekCompleted.filter(o =>
    new Date(o.created_at) >= today
  );

  const today_orders = todayCompleted.length;
  const today_revenue = todayCompleted.reduce((s, o) => s + Number(o.total), 0);

  const week_orders = weekCompleted.length;
  const week_revenue = weekCompleted.reduce((s, o) => s + Number(o.total), 0);

  const month_orders = monthData?.length ?? 0;
  const month_revenue = monthData?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

  const total_orders = totalData?.length ?? 0;
  const total_revenue = totalData?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

  // ── Estados activos ────────────────────────────────────────────────────
  const pendingOrders = activeData?.filter(o => ["pending", "confirmed"].includes(o.status)).length ?? 0;
  const preparingOrders = activeData?.filter(o => o.status === "preparing").length ?? 0;
  const readyOrders = activeData?.filter(o => o.status === "ready").length ?? 0;

  // ── Chart: pedidos por día (últimos 7 días) ───────────────────────────
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      key: d.toISOString().split("T")[0] ?? "",
      label: d.toLocaleDateString("es-AR", { weekday: "short" }),
    };
  });

  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  weekCompleted.forEach(order => {
    const key = new Date(order.created_at).toISOString().split("T")[0] ?? "";
    const prev = dailyMap.get(key) ?? { orders: 0, revenue: 0 };
    dailyMap.set(key, {
      orders: prev.orders + 1,
      revenue: prev.revenue + Number(order.total),
    });
  });

  const chartData = last7Days.map(({ key, label }) => ({
    name: label,
    pedidos: dailyMap.get(key)?.orders ?? 0,
    ingresos: Math.round(dailyMap.get(key)?.revenue ?? 0),
  }));

  // ── Top productos del mes ─────────────────────────────────────────────
  const productMap = new Map<string, number>();
  ordersWithItems?.forEach(order => {
    order.order_items?.forEach(item => {
      productMap.set(item.product_name, (productMap.get(item.product_name) ?? 0) + item.quantity);
    });
  });

  const topProducts = Array.from(productMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  // ── Rating ────────────────────────────────────────────────────────────
  const reviewCount = reviewsData?.length ?? 0;
  const avgRating = reviewCount > 0
    ? reviewsData!.reduce((s, r) => s + r.store_rating, 0) / reviewCount
    : null;

  const initial = {
    today: { orders: today_orders, revenue: today_revenue },
    week: { orders: week_orders, revenue: week_revenue },
    month: { orders: month_orders, revenue: month_revenue },
    total: { orders: total_orders, revenue: total_revenue },
    pendingOrders,
    preparingOrders,
    readyOrders,
    chartData,
    topProducts,
    avgRating,
    reviewCount,
  };

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Estadísticas
        </h1>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-0.5">
          Seguimiento del rendimiento de tu comercio.
        </p>
      </header>

      <StatsDashboard storeId={storeId} initial={initial} />
    </div>
  );
}
