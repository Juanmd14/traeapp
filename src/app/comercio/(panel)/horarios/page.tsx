import { redirect } from "next/navigation";

import { requireAuth, getUserStores } from "@/server/auth/session";
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

  const storeId = stores[0]?.storeId;
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = createClient();
  const { data } = await supabase
    .from("store_hours")
    .select("weekday, opens_at, closes_at")
    .eq("store_id", storeId) as { data: { weekday: number; opens_at: string; closes_at: string }[] | null };

  const initial = Array(7).fill(null).map((_, i) => {
    const day = data?.find((h) => h.weekday === i);
    return day
      ? { isOpen: true, opensAt: day.opens_at.slice(0, 5), closesAt: day.closes_at.slice(0, 5) }
      : { isOpen: false, opensAt: "09:00", closesAt: "22:00" };
  });

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Horarios de atención
        </h1>
        <p className="text-body-md text-neutral-500 mt-0.5">
          Configurá los días y horarios en que tu comercio recibe pedidos.
        </p>
      </header>

      <StoreHoursForm storeId={storeId} initial={initial} />
    </div>
  );
}