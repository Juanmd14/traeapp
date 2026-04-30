import { redirect } from "next/navigation";
import { OnboardingStepper } from "@/components/store-admin/onboarding-stepper";
import { OnboardingProductsForm } from "@/components/store-admin/onboarding-products-form";

const STEPS = [
  { id: "basic",     label: "Datos" },
  { id: "address",   label: "Dirección" },
  { id: "operation", label: "Operación" },
  { id: "products",  label: "Productos" },
  { id: "publish",   label: "Publicar" },
];

export const metadata = { title: "Productos · Onboarding" };

export default function OnboardingProductsPage({
  searchParams,
}: {
  searchParams: { storeId?: string };
}) {
  if (!searchParams.storeId) redirect("/comercio/onboarding");

  return (
    <div className="max-w-5xl mx-auto">
      <OnboardingStepper steps={STEPS} currentIndex={3} />

      <div className="bg-white rounded-xl shadow-card p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Cargá tus productos
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Empezá con tus 5-10 productos más vendidos. El resto lo sumás después.
          </p>
        </header>

        <OnboardingProductsForm storeId={searchParams.storeId} />
      </div>
    </div>
  );
}
