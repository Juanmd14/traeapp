import { redirect } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { requireRole } from "@/server/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AvailableOrderCard } from "@/components/driver/available-order-card";
import { DriverOnlineToggle } from "@/components/driver/driver-online-toggle";

export const dynamic = "force-dynamic";

export default async function DisponiblesPage() {
  const session = await requireRole(["delivery_driver", "admin"]);

  // Si ya tiene un pedido activo, ir a activo
  const { data: driverStatus } = await (supabaseAdmin.from("driver_status") as any)
    .select("is_online, active_order_id")
    .eq("driver_id", session.id)
    .maybeSingle();

  if (driverStatus?.active_order_id) {
    redirect("/driver/activo");
  }

  // Pedidos listos sin repartidor asignado
  const { data: orders } = await (supabaseAdmin.from("orders") as any)
    .select(`
      id,
      order_number,
      total,
      delivery_fee,
      delivery_address_text,
      ready_at,
      stores ( name, address )
    `)
    .eq("status", "ready")
    .is("driver_id", null)
    .order("ready_at", { ascending: true });

  // Contar ítems por pedido
  const orderIds = (orders ?? []).map((o: any) => o.id);
  let itemCounts: Record<string, number> = {};
  if (orderIds.length > 0) {
    const { data: items } = await (supabaseAdmin.from("order_items") as any)
      .select("order_id, quantity")
      .in("order_id", orderIds);

    for (const item of items ?? []) {
      itemCounts[item.order_id] = (itemCounts[item.order_id] ?? 0) + item.quantity;
    }
  }

  const availableOrders = (orders ?? []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    total: Number(o.total),
    delivery_fee: Number(o.delivery_fee),
    delivery_address_text: o.delivery_address_text,
    ready_at: o.ready_at,
    items_count: itemCounts[o.id] ?? 0,
    stores: o.stores,
  }));

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Pedidos disponibles</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {availableOrders.length === 0
              ? "No hay pedidos listos ahora"
              : `${availableOrders.length} ${availableOrders.length === 1 ? "pedido esperando" : "pedidos esperando"}`}
          </p>
        </div>
        <DriverOnlineToggle initialOnline={driverStatus?.is_online ?? false} />
      </div>

      {/* Lista */}
      {availableOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <PackageSearch className="size-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium">Sin pedidos listos</p>
          <p className="text-sm text-neutral-400 mt-1">Esta pantalla se actualiza cada vez que la visitás</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableOrders.map((order: Parameters<typeof AvailableOrderCard>[0]["order"]) => (
            <AvailableOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
