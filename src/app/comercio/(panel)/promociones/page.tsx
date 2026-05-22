import { redirect } from "next/navigation";

import { requireAuth, getUserStores } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PromotionsManager } from "@/components/store-admin/promotions-manager";

export const metadata = { title: "Promociones" };
export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  const session = await requireAuth("/login?next=/comercio/promociones");
  const stores = await getUserStores(session.id);

  if (stores.length === 0 && session.role !== "admin") {
    redirect("/comercio/onboarding");
  }

  const storeId = stores[0]?.storeId;
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = createClient();
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

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
          Promociones
        </h1>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-0.5">
          Crea códigos de descuento y ofertas especiales para tus clientes.
        </p>
      </header>

      <PromotionsManager storeId={storeId} initial={(data ?? []) as any} />
    </div>
  );
}