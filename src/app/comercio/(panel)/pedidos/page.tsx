import { redirect } from "next/navigation";
import { requireAuth, getUserStores } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StoreKds } from "@/components/store-admin/store-kds";
import { StoreStatusToggle } from "@/components/store-admin/store-status-toggle";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await requireAuth("/login?next=/comercio/pedidos");
  const stores = await getUserStores(session.id);

  if (stores.length === 0 && session.role !== "admin") {
    redirect("/comercio/onboarding");
  }

  // En MVP, asumimos un comercio por usuario.
  // Cuando un user tenga múltiples, agregamos selector arriba.
  const storeId = stores[0]?.storeId;
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = createClient();

  // Datos de la tienda
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, status, avg_prep_minutes")
    .eq("id", storeId)
    .single();

  if (!store) redirect("/comercio/onboarding");

  // Pedidos activos (los que importan al KDS)
  const { data: activeOrders } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, payment_method, payment_status,
      total, customer_notes, delivery_address_text,
      created_at, confirmed_at, ready_at, customer_id
    `)
    .eq("store_id", storeId)
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: false });

  // Items de esos pedidos
  const orderIds = (activeOrders ?? []).map((o) => o.id);
  let itemsByOrder: Record<string, any[]> = {};
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("id, order_id, product_name, quantity, total, notes")
      .in("order_id", orderIds);

    (items ?? []).forEach((it) => {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push(it);
    });
  }

  // Métricas del día (medianoche local del servidor → ahora)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("id, total, status")
    .eq("store_id", storeId)
    .gte("created_at", today.toISOString())
    .not("status", "in", "(cancelled,rejected)");

  const todayCount = todayOrders?.length ?? 0;
  const todayRevenue = (todayOrders ?? []).reduce(
    (acc, o) => acc + Number(o.total ?? 0),
    0,
  );
  const newCount = (activeOrders ?? []).filter(
    (o) => o.status === "pending" || (o.status === "confirmed" && o.payment_status === "approved"),
  ).length;

  const isActive = store.status === "active";

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Pedidos en vivo
          </h1>
          <p className="text-body-md text-neutral-500 mt-0.5">
            {isActive
              ? "Los pedidos nuevos aparecen acá automáticamente"
              : "Tu tienda está pausada. Los clientes no pueden hacer pedidos."}
          </p>
        </div>
        <StoreStatusToggle storeId={store.id} initialActive={isActive} />
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4">
          <p className="text-body-xs text-neutral-500 uppercase tracking-wider">
            Hoy
          </p>
          <p className="text-heading-lg sm:text-display-md font-bold text-neutral-900 mt-0.5">
            {todayCount}
          </p>
          <p className="text-body-xs text-neutral-500">
            {todayCount === 1 ? "pedido" : "pedidos"}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4">
          <p className="text-body-xs text-neutral-500 uppercase tracking-wider">
            Ingreso hoy
          </p>
          <p className="text-heading-lg sm:text-display-md font-bold text-neutral-900 mt-0.5">
            {formatPrice(todayRevenue)}
          </p>
          <p className="text-body-xs text-neutral-500">facturado</p>
        </div>

        <div
          className={
            "rounded-md p-3 sm:p-4 border " +
            (newCount > 0
              ? "bg-primary-50 border-primary-200"
              : "bg-white border-neutral-200")
          }
        >
          <p
            className={
              "text-body-xs uppercase tracking-wider " +
              (newCount > 0 ? "text-primary-700" : "text-neutral-500")
            }
          >
            Nuevos
          </p>
          <p
            className={
              "text-heading-lg sm:text-display-md font-bold mt-0.5 " +
              (newCount > 0 ? "text-primary-700" : "text-neutral-900")
            }
          >
            {newCount}
          </p>
          <p
            className={
              "text-body-xs " +
              (newCount > 0 ? "text-primary-600" : "text-neutral-500")
            }
          >
            esperando
          </p>
        </div>
      </div>

      {/* KDS */}
      <StoreKds
        storeId={store.id}
        initialOrders={(activeOrders ?? []) as any}
        itemsByOrder={itemsByOrder}
      />
    </div>
  );
}
