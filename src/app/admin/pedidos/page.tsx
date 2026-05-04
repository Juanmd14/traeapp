import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos · Admin" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  picked_up: "En camino",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
  rejected: "Rechazado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-warning-100 text-warning-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-blue-100 text-blue-700",
  ready: "bg-purple-100 text-purple-700",
  picked_up: "bg-primary-100 text-primary-700",
  delivered: "bg-accent-100 text-accent-700",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

type Order = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
  stores: { name: string } | null;
  profiles: { full_name: string } | null;
};

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  await requireRole("admin");

  const statusFilter = searchParams.estado;

  let query = (supabaseAdmin.from("orders") as any)
    .select(`
      id,
      order_number,
      status,
      total,
      created_at,
      stores ( name ),
      profiles:customer_id ( full_name )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: orders } = await query;

  const activeStatuses = ["pending", "confirmed", "preparing", "ready", "picked_up"];
  const activeCount = (orders ?? []).filter((o: Order) =>
    activeStatuses.includes(o.status)
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-heading-xl font-bold text-neutral-900">Pedidos</h1>
        {activeCount > 0 && (
          <p className="text-body-sm text-neutral-500 mt-0.5">
            {activeCount} pedido{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[
          { value: undefined, label: "Todos" },
          { value: "pending", label: "Pendientes" },
          { value: "preparing", label: "Preparando" },
          { value: "ready", label: "Listos" },
          { value: "picked_up", label: "En camino" },
          { value: "delivered", label: "Entregados" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/pedidos?estado=${f.value}` : "/admin/pedidos"}
            className={`px-3 py-1.5 rounded-lg text-body-sm font-medium border transition ${
              statusFilter === f.value || (!statusFilter && !f.value)
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {!orders || orders.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-body-md">
            No hay pedidos
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">#</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Comercio</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-500">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(orders as Order[]).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      #{order.order_number}
                    </td>
                    <td className="px-4 py-3 text-neutral-800">
                      {order.stores?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {order.profiles?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          STATUS_COLOR[order.status] ?? "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/pedido/${order.id}`}
                        className="text-primary text-body-sm font-medium hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
