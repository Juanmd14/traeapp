import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { requireAuth } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OrderListItem } from "@/components/order/order-list-item";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Mis pedidos" };

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
  stores: { name: string } | null;
  order_items: { id: string }[] | null;
};

export default async function PedidosPage() {
  const session = await requireAuth("/login?next=/pedidos");

  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, total, created_at,
      stores ( name ),
      order_items ( id )
    `)
    .eq("customer_id", session.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (orders ?? []) as unknown as OrderRow[];

  return (
    <div className="container-shop py-5 space-y-4">
      <h1 className="text-heading-xl font-semibold text-neutral-900">Mis pedidos</h1>

      {list.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <div className="size-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="size-6 text-neutral-400" />
          </div>
          <h2 className="text-heading-sm font-medium text-neutral-900 mb-1">
            Todavía no hiciste pedidos
          </h2>
          <p className="text-body-md text-neutral-500 mb-5">
            Cuando hagas tu primer pedido, aparece acá.
          </p>
          <Button asChild>
            <Link href="/">Ver comercios</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((o) => (
            <li key={o.id}>
              <OrderListItem
                order={{
                  id: o.id,
                  orderNumber: o.order_number,
                  status: o.status as any,
                  total: Number(o.total),
                  createdAt: o.created_at,
                  storeName: o.stores?.name ?? "",
                  itemCount: o.order_items?.length ?? 0,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
