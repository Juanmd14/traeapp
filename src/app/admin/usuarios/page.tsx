import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/server/auth/session";
import { UserRoleSelect, ToggleActiveButton } from "@/components/admin/user-row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios · Admin" };

const ROLE_LABEL: Record<string, string> = {
  customer: "Cliente",
  delivery_driver: "Repartidor",
  store_owner: "Dueño de comercio",
  store_staff: "Staff de comercio",
  admin: "Administrador",
};

const ROLE_COLOR: Record<string, string> = {
  customer: "bg-neutral-100 text-neutral-600",
  delivery_driver: "bg-blue-100 text-blue-700",
  store_owner: "bg-purple-100 text-purple-700",
  store_staff: "bg-purple-50 text-purple-600",
  admin: "bg-primary-100 text-primary-700",
};

type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("admin");

  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";

  let query = (supabaseAdmin.from("profiles") as any)
    .select("id, full_name, email, phone, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const { data: profiles } = await query;
  const users = (profiles ?? []) as Profile[];

  const totals = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-heading-xl font-bold text-neutral-900">Usuarios</h1>
          <p className="text-body-sm text-neutral-500 mt-0.5">
            {totals.active} activo{totals.active !== 1 ? "s" : ""} · {totals.total} en total
          </p>
        </div>

        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email…"
            className="text-body-sm border border-neutral-200 rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="bg-primary text-white text-body-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90 transition"
          >
            Buscar
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-16 text-center text-neutral-500 text-body-md">
          {q ? `Sin resultados para "${q}"` : "No hay usuarios registrados"}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Registro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{user.full_name}</p>
                      <p className="text-neutral-400 text-[11px]">{user.email ?? "—"}</p>
                      {user.phone && (
                        <p className="text-neutral-400 text-[11px]">{user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            ROLE_COLOR[user.role] ?? "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {ROLE_LABEL[user.role] ?? user.role}
                        </span>
                        <UserRoleSelect userId={user.id} currentRole={user.role} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          user.is_active
                            ? "bg-accent-100 text-accent-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleActiveButton userId={user.id} isActive={user.is_active} />
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
