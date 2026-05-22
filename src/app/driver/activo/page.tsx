import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { requireRole } from "@/server/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ActiveDeliveryView } from "@/components/driver/active-delivery-view";

export const dynamic = "force-dynamic";

export default async function ActivoPage() {
  const session = await requireRole(["delivery_driver", "admin"]);

  const { data: delivery } = await (supabaseAdmin.from("deliveries") as any)
    .select(`
      id,
      status,
      order_id,
      orders (
        id,
        order_number,
        total,
        delivery_fee,
        delivery_address_text,
        customer_notes,
        status,
        stores ( name, address ),
        profiles:customer_id ( full_name )
      )
    `)
    .eq("driver_id", session.id)
    .not("status", "in", '("delivered","failed")')
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!delivery || !delivery.orders) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Pedido activo</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <PackageSearch className="size-8 text-neutral-400 dark:text-neutral-500" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 font-medium">Sin pedido activo</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1 mb-6">Tomá un pedido disponible para empezar</p>
          <Link
            href="/driver/disponibles"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition"
          >
            Ver disponibles
          </Link>
        </div>
      </div>
    );
  }

  const order = delivery.orders;

  // Contar ítems
  const { data: items } = await (supabaseAdmin.from("order_items") as any)
    .select("quantity")
    .eq("order_id", order.id);

  const itemsCount = (items ?? []).reduce((acc: number, i: any) => acc + i.quantity, 0);

  const data = {
    deliveryId: delivery.id,
    status: delivery.status,
    orderId: order.id,
    orderNumber: order.order_number,
    storeName: order.stores?.name ?? "",
    storeAddress: order.stores?.address ?? "",
    deliveryAddress: order.delivery_address_text,
    customerName: order.profiles?.full_name ?? "Cliente",
    total: Number(order.total),
    deliveryFee: Number(order.delivery_fee),
    itemsCount,
    customerNotes: order.customer_notes ?? null,
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Pedido activo</h1>
      <ActiveDeliveryView data={data} />
    </div>
  );
}
