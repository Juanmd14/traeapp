import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/server/auth/session";
import { ExternalLink, Plus, Settings } from "lucide-react";
import { StoreStatusSelect } from "@/components/admin/store-status-select";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comercios · Admin" };

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  draft: "Borrador",
  pending_review: "En revisión",
  closed: "Cerrado",
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-accent-100 text-accent-700",
  paused: "bg-warning-100 text-warning-700",
  draft: "bg-neutral-100 text-neutral-500",
  pending_review: "bg-blue-100 text-blue-700",
  closed: "bg-red-100 text-red-600",
};

type Store = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  categories: { name: string } | null;
  store_users: { profiles: { full_name: string; email: string } | null }[];
};

export default async function AdminComerciosPage() {
  await requireRole("admin");

  const { data: stores } = await (supabaseAdmin.from("stores") as any)
    .select(`
      id, name, slug, status, created_at,
      categories ( name ),
      store_users ( profiles:user_id ( full_name, email ) )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const all = (stores ?? []) as Store[];
  const active = all.filter((s) => s.status === "active").length;
  const pendingReview = all.filter((s) => s.status === "pending_review").length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-heading-xl font-bold text-neutral-900">Comercios</h1>
          <p className="text-body-sm text-neutral-500 mt-0.5">
            {active} activo{active !== 1 ? "s" : ""}
            {pendingReview > 0 && ` · ${pendingReview} en revisión`}
            {" · "}{all.length} en total
          </p>
        </div>
        <Link
          href="/admin/comercios/nueva"
          className="inline-flex items-center gap-2 bg-primary text-white text-body-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="size-4" />
          Nuevo comercio
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-16 text-center text-neutral-500 text-body-md">
          No hay comercios registrados
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Comercio</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Dueño</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Registro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {all.map((store) => {
                  const owner = store.store_users[0]?.profiles ?? null;
                  return (
                    <tr key={store.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{store.name}</p>
                        <p className="text-neutral-400 text-[11px]">/{store.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        {owner ? (
                          <>
                            <p className="text-neutral-700">{owner.full_name}</p>
                            <p className="text-neutral-400 text-[11px]">{owner.email}</p>
                          </>
                        ) : (
                          <span className="text-neutral-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              STATUS_COLOR[store.status] ?? "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {STATUS_LABEL[store.status] ?? store.status}
                          </span>
                          <StoreStatusSelect
                            storeId={store.id}
                            currentStatus={store.status}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {new Date(store.created_at).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/comercios/${store.id}`}
                            className="inline-flex items-center gap-1 text-neutral-600 text-body-sm font-medium hover:text-neutral-900 transition"
                            title="Gestionar"
                          >
                            <Settings className="size-4" />
                          </Link>
                          <Link
                            href={`/s/${store.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-primary text-body-sm font-medium hover:underline"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
