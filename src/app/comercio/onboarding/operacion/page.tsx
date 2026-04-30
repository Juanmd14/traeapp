import { redirect } from "next/navigation";
import { OnboardingStepper } from "@/components/store-admin/onboarding-stepper";
import { OnboardingOperationForm } from "@/components/store-admin/onboarding-operation-form";

const STEPS = [
  { id: "basic",     label: "Datos" },
  { id: "address",   label: "Dirección" },
  { id: "operation", label: "Operación" },
  { id: "products",  label: "Productos" },
  { id: "publish",   label: "Publicar" },
];

export const metadata = { title: "Operación · Onboarding" };

export default function OnboardingOperationPage({
  searchParams,
}: {
  searchParams: { storeId?: string };
}) {
  if (!searchParams.storeId) redirect("/comercio/onboarding");

  return (
    <div className="max-w-3xl mx-auto">
      <OnboardingStepper steps={STEPS} currentIndex={2} />

      <div className="bg-white rounded-xl shadow-card p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            ¿Cómo trabajás?
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Estos parámetros los podés cambiar en cualquier momento desde el panel.
          </p>
        </header>

        <OnboardingOperationForm storeId={searchParams.storeId} />
      </div>
    </div>
  );
}
