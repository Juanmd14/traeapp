import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/server/auth/session";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comercios · Admin" };

type Store = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  category: string | null;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
};

export default async function AdminComerciosPage() {
  await requireRole("admin");

  const { data: stores } = await (supabaseAdmin.from("stores") as any)
    .select(`
      id,
      name,
      slug,
      is_active,
      category,
      created_at,
      store_users ( profiles:user_id ( full_name, email ) )
    `)
    .order("created_at", { ascending: false });

  const total = (stores ?? []).length;
  const active = (stores ?? []).filter((s: any) => s.is_active).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-heading-xl font-bold text-neutral-900">Comercios</h1>
        <p className="text-body-sm text-neutral-500 mt-0.5">
          {active} activo{active !== 1 ? "s" : ""} · {total} en total
        </p>
      </div>

      {!stores || stores.length === 0 ? (
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
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Registro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(stores as Store[]).map((store) => (
                  <tr key={store.id} className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{store.name}</p>
                      <p className="text-neutral-400 text-[11px]">/{store.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {store.category ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          store.is_active
                            ? "bg-accent-100 text-accent-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {store.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {new Date(store.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tienda/${store.slug}`}
                        className="inline-flex items-center gap-1 text-primary text-body-sm font-medium hover:underline"
                      >
                        Ver
                        <ExternalLink className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
