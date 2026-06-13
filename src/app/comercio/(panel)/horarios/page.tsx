import { redirect } from "next/navigation";

import { requireAuth, getUserStores, getActiveStoreId } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StoreHoursForm } from "@/components/store-admin/store-hours-form";

export const metadata = { title: "Horarios" };
export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  const session = await requireAuth("/login?next=/comercio/horarios");
  const stores = await getUserStores(session.id);

  if (stores.length === 0 && session.role !== "admin") {
    redirect("/comercio/onboarding");
  }

  const storeId = await getActiveStoreId(stores);
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("store_hours")
    .select("weekday, opens_at, closes_at")
    .eq("store_id", storeId)
    .order("opens_at") as { data: { weekday: number; opens_at: string; closes_at: string }[] | null };

  // Agrupamos todas las filas de cada día en sus tramos (ej: 08–13 y 14–17).
  const initial = Array(7).fill(null).map((_, i) => {
    const ranges = (data ?? [])
      .filter((h) => h.weekday === i)
      .map((h) => ({ opensAt: h.opens_at.slice(0, 5), closesAt: h.closes_at.slice(0, 5) }));
    return ranges.length > 0
      ? { isOpen: true, ranges }
      : { isOpen: false, ranges: [{ opensAt: "09:00", closesAt: "22:00" }] };
  });

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <a
          href="/comercio/pedidos"
          className="inline-flex items-center gap-1 text-body-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition mb-3"
        >
          <span aria-hidden>←</span> Volver al panel
        </a>
        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Horarios de atención
        </h1>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-0.5">
          Configurá los días y horarios en que tu comercio recibe pedidos.
        </p>
      </header>

      <StoreHoursForm storeId={storeId} initial={initial} />
    </div>
  );
}