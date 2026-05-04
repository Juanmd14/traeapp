import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/server/auth/session";
import { AddDriverForm, RemoveDriverButton } from "@/components/admin/driver-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Repartidores · Admin" };

type Driver = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  driver_status: {
    is_online: boolean;
    current_lat: number | null;
    current_lng: number | null;
    last_seen_at: string | null;
    active_order_id: string | null;
  } | null;
};

export default async function AdminRepartidoresPage() {
  await requireRole("admin");

  const { data: drivers } = await (supabaseAdmin.from("profiles") as any)
    .select(`
      id,
      full_name,
      email,
      phone,
      driver_status ( is_online, current_lat, current_lng, last_seen_at, active_order_id )
    `)
    .eq("role", "delivery_driver")
    .order("full_name");

  const all = (drivers ?? []) as Driver[];
  const online = all.filter((d) => d.driver_status?.is_online).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-heading-xl font-bold text-neutral-900">Repartidores</h1>
          <p className="text-body-sm text-neutral-500 mt-0.5">
            {online} online · {all.length} en total
          </p>
        </div>
      </div>

      {/* Agregar repartidor */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <p className="text-body-sm font-medium text-neutral-700 mb-3">
          Asignar repartidor por email
        </p>
        <AddDriverForm />
      </div>

      {all.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-16 text-center text-neutral-500 text-body-md">
          No hay repartidores registrados
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((driver) => {
            const status = driver.driver_status;
            const isOnline = status?.is_online ?? false;
            const hasActiveOrder = !!status?.active_order_id;
            const lastSeen = status?.last_seen_at ? new Date(status.last_seen_at) : null;

            return (
              <div
                key={driver.id}
                className="bg-white rounded-xl border border-neutral-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-semibold text-body-md shrink-0">
                      {driver.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-md font-semibold text-neutral-900 truncate">
                        {driver.full_name}
                      </p>
                      <p className="text-body-xs text-neutral-500 truncate">
                        {driver.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                      isOnline
                        ? "bg-accent-100 text-accent-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        isOnline ? "bg-accent-500" : "bg-neutral-400"
                      }`}
                    />
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {driver.phone && (
                    <p className="text-body-xs text-neutral-500">Tel: {driver.phone}</p>
                  )}
                  {hasActiveOrder && (
                    <p className="text-body-xs font-medium text-primary">
                      Entregando un pedido ahora
                    </p>
                  )}
                  {isOnline && !hasActiveOrder && (
                    <p className="text-body-xs text-accent-600 font-medium">
                      Disponible para pedidos
                    </p>
                  )}
                  {lastSeen && (
                    <p className="text-body-xs text-neutral-400">
                      Visto:{" "}
                      {lastSeen.toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <RemoveDriverButton userId={driver.id} name={driver.full_name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
