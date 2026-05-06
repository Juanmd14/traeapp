import { redirect } from "next/navigation";

import {
  requireAuth,
  getUserStores,
} from "@/server/auth/session";

import { createClient } from "@/lib/supabase/server";

import { StoreKds } from "@/components/store-admin/store-kds";
import { StoreStatusToggle } from "@/components/store-admin/store-status-toggle";

import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Pedidos",
};

export const dynamic = "force-dynamic";

type ActiveOrder = {
  id: string;
  order_number: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  total: number | null;
  customer_notes: string | null;
  delivery_address_text: string | null;
  created_at: string;
  confirmed_at: string | null;
  ready_at: string | null;
  customer_id: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  total: number;
  notes: string | null;
};

type StoreData = {
  id: string;
  name: string;
  status: string;
  avg_prep_minutes: number | null;
};

type TodayOrder = {
  id: string;
  total: number | null;
  status: string;
};

export default async function PedidosPage() {
  const session = await requireAuth(
    "/login?next=/comercio/pedidos"
  );

  const stores = await getUserStores(session.id);

  if (
    stores.length === 0 &&
    session.role !== "admin"
  ) {
    redirect("/comercio/onboarding");
  }

  const storeId = stores[0]?.storeId;

  if (!storeId) {
    redirect("/comercio/onboarding");
  }

  const supabase = await createClient();

  // Datos del comercio
  const { data: storeData } = await supabase
    .from("stores")
    .select(`
      id,
      name,
      status,
      avg_prep_minutes
    `)
    .eq("id", storeId)
    .single();

  const store = storeData as StoreData | null;

  if (!store) {
    redirect("/comercio/onboarding");
  }

  // Pedidos activos
  const { data: activeOrdersData } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      payment_method,
      payment_status,
      total,
      customer_notes,
      delivery_address_text,
      created_at,
      confirmed_at,
      ready_at,
      customer_id
    `)
    .eq("store_id", storeId)
    .in("status", [
      "pending",
      "confirmed",
      "preparing",
      "ready",
    ])
    .order("created_at", {
      ascending: false,
    });

  const activeOrders =
    (activeOrdersData as ActiveOrder[]) ?? [];

  // IDs pedidos
  const orderIds = activeOrders.map(
    (o) => o.id
  );

  // Items agrupados
  const itemsByOrder: Record<
    string,
    OrderItem[]
  > = {};

  if (orderIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("order_items")
      .select(`
        id,
        order_id,
        product_name,
        quantity,
        total,
        notes
      `)
      .in("order_id", orderIds);

    const items =
      (itemsData as OrderItem[]) ?? [];

    items.forEach((it) => {
      itemsByOrder[it.order_id] ??= [];
      itemsByOrder[it.order_id]!.push(it);
    });
  }

  // Métricas del día
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const { data: todayOrdersData } =
    await supabase
      .from("orders")
      .select(`
        id,
        total,
        status
      `)
      .eq("store_id", storeId)
      .gte(
        "created_at",
        today.toISOString()
      )
      .not(
        "status",
        "in",
        "(cancelled,rejected)"
      );

  const todayOrders =
    (todayOrdersData as TodayOrder[]) ??
    [];

  const todayCount = todayOrders.length;

  const todayRevenue = todayOrders.reduce(
    (acc, o) => acc + Number(o.total ?? 0),
    0
  );

  const newCount = activeOrders.filter(
    (o) =>
      o.status === "pending" ||
      (o.status === "confirmed" &&
        o.payment_status === "approved")
  ).length;

  const isActive =
    store.status === "active";

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Pedidos en vivo
          </h1>

          <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isActive
              ? "Los pedidos nuevos aparecen acá automáticamente"
              : "Tu tienda está pausada. Los clientes no pueden hacer pedidos."}
          </p>
        </div>

        <StoreStatusToggle
          storeId={store.id}
          initialActive={isActive}
        />
      </header>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-3 sm:p-4">
          <p className="text-body-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Hoy
          </p>

          <p className="text-heading-lg sm:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {todayCount}
          </p>

          <p className="text-body-xs text-neutral-500 dark:text-neutral-400">
            {todayCount === 1
              ? "pedido"
              : "pedidos"}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-3 sm:p-4">
          <p className="text-body-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Ingreso hoy
          </p>

          <p className="text-heading-lg sm:text-display-md font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {formatPrice(todayRevenue)}
          </p>

          <p className="text-body-xs text-neutral-500 dark:text-neutral-400">
            facturado
          </p>
        </div>

        <div
          className={
            "rounded-md p-3 sm:p-4 border " +
            (newCount > 0
              ? "bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800"
              : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800")
          }
        >
          <p
            className={
              "text-body-xs uppercase tracking-wider " +
              (newCount > 0
                ? "text-primary-700 dark:text-primary-300"
                : "text-neutral-500 dark:text-neutral-400")
            }
          >
            Nuevos
          </p>

          <p
            className={
              "text-heading-lg sm:text-display-md font-bold mt-0.5 " +
              (newCount > 0
                ? "text-primary-700 dark:text-primary-300"
                : "text-neutral-900 dark:text-neutral-100")
            }
          >
            {newCount}
          </p>

          <p
            className={
              "text-body-xs " +
              (newCount > 0
                ? "text-primary-600 dark:text-primary-400"
                : "text-neutral-500 dark:text-neutral-400")
            }
          >
            esperando
          </p>
        </div>
      </div>

      <StoreKds
        storeId={store.id}
        initialOrders={activeOrders as any}
        itemsByOrder={itemsByOrder}
      />
    </div>
  );
}