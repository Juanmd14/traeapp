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

  // Queries para obtener métricas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString();

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthStr = monthAgo.toISOString();

  // Total histórico
  const { data: totalData } = await supabase
    .from("orders")
    .select("total, status")
    .eq("store_id", storeId)
    .in("status", ["completed", "delivered"]) as { data: { total: number; status: string }[] | null };

  // Pedidos de hoy
  const { data: todayData } = await supabase
    .from("orders")
    .select("total, status")
    .eq("store_id", storeId)
    .gte("created_at", todayStr) as { data: { total: number; status: string }[] | null };

  // Pedidos de la semana
  const { data: weekData } = await supabase
    .from("orders")
    .select("total, status")
    .eq("store_id", storeId)
    .gte("created_at", weekStr) as { data: { total: number; status: string }[] | null };

  // Pedidos por estado
  const { data: statusData } = await supabase
    .from("orders")
    .select("status")
    .eq("store_id", storeId)
    .in("status", ["pending", "preparing", "completed"]) as { data: { status: string }[] | null };

  const totalOrders = totalData?.length ?? 0;
  const totalRevenue = totalData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  const todayOrders = todayData?.filter(o => ["completed", "delivered"].includes(o.status)).length ?? 0;
  const todayRevenue = todayData?.filter(o => ["completed", "delivered"].includes(o.status)).reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  const weekOrders = weekData?.filter(o => ["completed", "delivered"].includes(o.status)).length ?? 0;
  const weekRevenue = weekData?.filter(o => ["completed", "delivered"].includes(o.status)).reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  const pendingOrders = statusData?.filter(o => o.status === "pending").length ?? 0;
  const preparingOrders = statusData?.filter(o => o.status === "preparing").length ?? 0;
  const completedOrders = statusData?.filter(o => o.status === "completed").length ?? 0;

  const initial = {
    totalOrders,
    totalRevenue,
    avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    pendingOrders,
    preparingOrders,
    completedOrders,
    todayOrders,
    todayRevenue,
    weekOrders,
    weekRevenue,
  };

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Estadísticas
        </h1>
        <p className="text-body-md text-neutral-500 mt-0.5">
          Seguimiento del rendimiento de tu comercio.
        </p>
      </header>

      <StatsDashboard storeId={storeId} initial={initial} />
    </div>
  );
}