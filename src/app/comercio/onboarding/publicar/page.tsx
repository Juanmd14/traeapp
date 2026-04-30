import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingStepper } from "@/components/store-admin/onboarding-stepper";
import { OnboardingPublishForm } from "@/components/store-admin/onboarding-publish-form";

const STEPS = [
  { id: "basic",     label: "Datos" },
  { id: "address",   label: "Dirección" },
  { id: "operation", label: "Operación" },
  { id: "products",  label: "Productos" },
  { id: "publish",   label: "Publicar" },
];

export const metadata = { title: "Publicar · Onboarding" };

export default async function OnboardingPublishPage({
  searchParams,
}: {
  searchParams: { storeId?: string };
}) {
  if (!searchParams.storeId) redirect("/comercio/onboarding");

  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, address")
    .eq("id", searchParams.storeId)
    .single();

  if (!store) redirect("/comercio/onboarding");

  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("is_active", true);

  return (
    <div className="max-w-3xl mx-auto">
      <OnboardingStepper steps={STEPS} currentIndex={4} />

      <div className="bg-white rounded-xl shadow-card p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            ¡Casi listo!
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Revisá los datos y publicá tu comercio en el marketplace.
          </p>
        </header>

        <OnboardingPublishForm
          storeId={store.id}
          storeName={store.name}
          productCount={productCount ?? 0}
          address={store.address}
        />
      </div>
    </div>
  );
}
