import { redirect } from "next/navigation";

import {
  requireAuth,
  getUserStores,
  getActiveStoreId,
} from "@/server/auth/session";

import { createClient } from "@/lib/supabase/server";

import { StoreDatosForm } from "@/components/store-admin/store-datos-form";

export const metadata = {
  title: "Mi comercio",
};

export const dynamic = "force-dynamic";

type StoreData = {
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  delivery_radius_km: number | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp_number: string | null;
  whatsapp_notifications_enabled: boolean | null;
  whatsapp_provider_key: string | null;
};

export default async function DatosComercioPage() {
  const session = await requireAuth(
    "/login?next=/comercio/datos"
  );

  const stores = await getUserStores(session.id);

  if (
    stores.length === 0 &&
    session.role !== "admin"
  ) {
    redirect("/comercio/onboarding");
  }

  const storeId = getActiveStoreId(stores);

  if (!storeId) {
    redirect("/comercio/onboarding");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .select(`
      name,
      description,
      phone,
      email,
      address,
      lat,
      lng,
      delivery_radius_km,
      logo_url,
      cover_url,
      whatsapp_number,
      whatsapp_notifications_enabled,
      whatsapp_provider_key
    `)
    .eq("id", storeId)
    .single();

  const store = data as StoreData | null;

  if (error || !store) {
    redirect("/comercio/onboarding");
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <a
          href="/comercio/pedidos"
          className="inline-flex items-center gap-1 text-body-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition mb-3"
        >
          <span aria-hidden>←</span> Volver al panel
        </a>
        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Mi comercio
        </h1>

        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-0.5">
          Actualizá datos públicos, teléfono,
          email y dirección de tu local.
        </p>
      </header>

      <StoreDatosForm
        storeId={storeId}
        initial={{
          name: store.name,
          description: store.description,
          phone: store.phone,
          email: store.email,
          address: store.address ?? "",
          lat: store.lat,
          lng: store.lng,
          delivery_radius_km: Number(
            store.delivery_radius_km ?? 0
          ),
          logo_url: store.logo_url,
          cover_url: store.cover_url,
          whatsapp_number: store.whatsapp_number,
          whatsapp_notifications_enabled:
            store.whatsapp_notifications_enabled ?? false,
          whatsapp_provider_key: store.whatsapp_provider_key,
        }}
      />
    </div>
  );
}