import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AvailableOrdersList } from "@/components/driver/available-orders-list";

export const dynamic = "force-dynamic";

export default async function DisponiblesPage() {
  const session = await requireRole(["delivery_driver", "admin"]);

  const { data: driverStatus } = await (supabaseAdmin.from("driver_status") as any)
    .select("is_online, active_order_id")
    .eq("driver_id", session.id)
    .maybeSingle();

  if (driverStatus?.active_order_id) {
    redirect("/driver/activo");
  }

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
    <AvailableOrdersList
      initialOrders={availableOrders}
      initialOnline={driverStatus?.is_online ?? false}
    />
  );
}
