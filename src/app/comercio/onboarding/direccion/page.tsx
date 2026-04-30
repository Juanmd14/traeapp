import { redirect } from "next/navigation";
import { OnboardingStepper } from "@/components/store-admin/onboarding-stepper";
import { OnboardingAddressForm } from "@/components/store-admin/onboarding-address-form";

const STEPS = [
  { id: "basic",     label: "Datos" },
  { id: "address",   label: "Dirección" },
  { id: "operation", label: "Operación" },
  { id: "products",  label: "Productos" },
  { id: "publish",   label: "Publicar" },
];

export const metadata = { title: "Dirección · Onboarding" };

export default function OnboardingAddressPage({
  searchParams,
}: {
  searchParams: { storeId?: string };
}) {
  if (!searchParams.storeId) redirect("/comercio/onboarding");

  return (
    <div className="max-w-3xl mx-auto">
      <OnboardingStepper steps={STEPS} currentIndex={1} />

      <div className="bg-white rounded-xl shadow-card p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            ¿Desde dónde entregás?
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Esta es la dirección de tu local. Los clientes verán la distancia desde acá.
          </p>
        </header>

        <OnboardingAddressForm storeId={searchParams.storeId} />
      </div>
    </div>
  );
}
