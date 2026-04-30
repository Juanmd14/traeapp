import { createClient } from "@/lib/supabase/server";
import { OnboardingStepper } from "@/components/store-admin/onboarding-stepper";
import { OnboardingBasicForm } from "@/components/store-admin/onboarding-basic-form";

const STEPS = [
  { id: "basic",     label: "Datos" },
  { id: "address",   label: "Dirección" },
  { id: "operation", label: "Operación" },
  { id: "products",  label: "Productos" },
  { id: "publish",   label: "Publicar" },
];

export const metadata = { title: "Crear comercio" };

export default async function OnboardingBasicPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, emoji")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="max-w-3xl mx-auto">
      <OnboardingStepper steps={STEPS} currentIndex={0} />

      <div className="bg-white rounded-xl shadow-card p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Contanos sobre tu comercio
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Estos datos aparecen en el marketplace para que los clientes te encuentren.
          </p>
        </header>

        <OnboardingBasicForm categories={categories ?? []} />
      </div>
    </div>
  );
}
