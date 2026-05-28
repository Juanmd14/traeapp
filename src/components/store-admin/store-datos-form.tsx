"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { StoreImageUpload } from "./store-image-upload";
import {
  storeProfileSchema,
  storeAddressSchema,
  storeNotificationsSchema,
  type StoreProfileInput,
  type StoreAddressInput,
  type StoreNotificationsInput,
} from "@/schemas";
import {
  updateStoreProfileAction,
  updateStoreAddressAction,
  updateStoreNotificationsAction,
  testWhatsappAction,
} from "@/server/actions/stores";
import { cn } from "@/lib/utils";

type Initial = {
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  delivery_radius_km: number;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp_number: string | null;
  whatsapp_notifications_enabled: boolean;
};

type Props = {
  storeId: string;
  initial: Initial;
};

export function StoreDatosForm({ storeId, initial }: Props) {
  const router = useRouter();
  const [serverErrorProfile, setServerErrorProfile] = useState<string | null>(null);
  const [serverErrorAddress, setServerErrorAddress] = useState<string | null>(null);
  const [serverErrorNotif, setServerErrorNotif] = useState<string | null>(null);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);
  const [pendingProfile, startProfile] = useTransition();
  const [pendingAddress, startAddress] = useTransition();
  const [pendingNotif, startNotif] = useTransition();
  const [pendingTest, startTest] = useTransition();
  const [logoUrl, setLogoUrl] = useState(initial.logo_url);
  const [coverUrl, setCoverUrl] = useState(initial.cover_url);

  const profileForm = useForm<StoreProfileInput>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      name: initial.name,
      description: initial.description ?? "",
      phone: initial.phone ?? "",
      email: initial.email ?? "",
    },
  });

  const addressForm = useForm<StoreAddressInput>({
    resolver: zodResolver(storeAddressSchema),
    defaultValues: {
      address: initial.address,
      lat: initial.lat ?? undefined,
      lng: initial.lng ?? undefined,
      deliveryRadiusKm: Number(initial.delivery_radius_km) || 5,
    },
  });

  const notificationsForm = useForm<StoreNotificationsInput>({
    resolver: zodResolver(storeNotificationsSchema),
    defaultValues: {
      whatsappEnabled: initial.whatsapp_notifications_enabled,
      whatsappNumber: initial.whatsapp_number ?? "",
    },
  });

  const radius = addressForm.watch("deliveryRadiusKm");
  const whatsappEnabled = notificationsForm.watch("whatsappEnabled");

  const onProfileSubmit = (data: StoreProfileInput) => {
    setServerErrorProfile(null);
    startProfile(async () => {
      const result = await updateStoreProfileAction({ ...data, storeId });
      if (result?.serverError) {
        setServerErrorProfile(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const onAddressSubmit = (data: StoreAddressInput) => {
    setServerErrorAddress(null);
    startAddress(async () => {
      const result = await updateStoreAddressAction({ ...data, storeId });
      if (result?.serverError) {
        setServerErrorAddress(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const onNotificationsSubmit = (data: StoreNotificationsInput) => {
    setServerErrorNotif(null);
    setNotifFeedback(null);
    startNotif(async () => {
      const result = await updateStoreNotificationsAction({ ...data, storeId });
      if (result?.serverError) {
        setServerErrorNotif(result.serverError);
        return;
      }
      setNotifFeedback("Notificaciones guardadas.");
      router.refresh();
    });
  };

  const onTestWhatsapp = () => {
    setServerErrorNotif(null);
    setNotifFeedback(null);
    startTest(async () => {
      const result = await testWhatsappAction({ storeId });
      if (result?.serverError) {
        setServerErrorNotif(result.serverError);
        return;
      }
      setNotifFeedback("Te enviamos un WhatsApp de prueba. Revisalo en unos segundos.");
    });
  };

  return (
    <div className="max-w-xl space-y-10">
      <section className="border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Imágenes del comercio
        </h2>
        <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mb-5">
          Logo y portada que se muestran en la tienda.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Logo
            </p>
            <StoreImageUpload
              storeId={storeId}
              currentUrl={logoUrl}
              type="logo"
              onUploadComplete={setLogoUrl}
            />
          </div>
          <div>
            <p className="text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Portada
            </p>
            <StoreImageUpload
              storeId={storeId}
              currentUrl={coverUrl}
              type="cover"
              onUploadComplete={setCoverUrl}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Datos y contacto
        </h2>
        <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mb-5">
          Nombre visible para clientes, teléfono para llamadas desde el pedido y email de contacto.
        </p>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <FormField
            label="Nombre del comercio"
            htmlFor="sd-name"
            required
            error={profileForm.formState.errors.name?.message}
          >
            <Input
              id="sd-name"
              invalid={!!profileForm.formState.errors.name}
              {...profileForm.register("name")}
            />
          </FormField>

          <FormField
            label="Descripción corta"
            htmlFor="sd-description"
            error={profileForm.formState.errors.description?.message}
            hint="Opcional. Se muestra en la tienda."
          >
            <textarea
              id="sd-description"
              rows={3}
              className={cn(
                "flex w-full rounded-md border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-body-md min-h-[88px]",
                "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary",
                profileForm.formState.errors.description
                  ? "border-destructive"
                  : "border-neutral-200 dark:border-neutral-700",
              )}
              {...profileForm.register("description")}
            />
          </FormField>

          <FormField
            label="Teléfono"
            htmlFor="sd-phone"
            required
            error={profileForm.formState.errors.phone?.message}
            hint="El cliente puede tocar para llamar desde el seguimiento del pedido."
          >
            <Input
              id="sd-phone"
              type="tel"
              placeholder="+54 9 …"
              invalid={!!profileForm.formState.errors.phone}
              {...profileForm.register("phone")}
            />
          </FormField>

          <FormField
            label="Email del comercio"
            htmlFor="sd-email"
            error={profileForm.formState.errors.email?.message}
            hint="Opcional."
          >
            <Input
              id="sd-email"
              type="email"
              autoComplete="email"
              invalid={!!profileForm.formState.errors.email}
              {...profileForm.register("email")}
            />
          </FormField>

          {serverErrorProfile && (
            <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
              {serverErrorProfile}
            </p>
          )}

          <Button type="submit" loading={pendingProfile}>
            Guardar datos y contacto
          </Button>
        </form>
      </section>

      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
        <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Notificaciones por WhatsApp
        </h2>
        <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mb-5">
          Te avisamos a WhatsApp cada vez que entra un pedido, así no
          dependés de tener abierto el panel.
        </p>

        <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-4 accent-primary-600"
              {...notificationsForm.register("whatsappEnabled")}
            />
            <span className="text-body-md text-neutral-900 dark:text-neutral-100">
              Activar notificaciones por WhatsApp
            </span>
          </label>

          <FormField
            label="Número de WhatsApp"
            htmlFor="sd-whatsapp-number"
            error={notificationsForm.formState.errors.whatsappNumber?.message}
            hint="Formato internacional. Ej: +5491122223333"
          >
            <Input
              id="sd-whatsapp-number"
              type="tel"
              placeholder="+5491122223333"
              invalid={!!notificationsForm.formState.errors.whatsappNumber}
              {...notificationsForm.register("whatsappNumber")}
            />
          </FormField>

          {notificationsForm.formState.errors.whatsappEnabled?.message && (
            <p className="text-body-sm text-destructive">
              {notificationsForm.formState.errors.whatsappEnabled.message}
            </p>
          )}

          {serverErrorNotif && (
            <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
              {serverErrorNotif}
            </p>
          )}

          {notifFeedback && (
            <p className="text-body-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-md">
              {notifFeedback}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={pendingNotif}>
              Guardar notificaciones
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onTestWhatsapp}
              loading={pendingTest}
              disabled={!whatsappEnabled}
            >
              Probar envío
            </Button>
          </div>
        </form>
      </section>

      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-10">
        <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Ubicación y reparto
        </h2>
        <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mb-5">
          Dirección desde donde salen los pedidos y radio de entrega.
        </p>

        <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
          <FormField
            label="Dirección del comercio"
            htmlFor="sd-address"
            required
            error={addressForm.formState.errors.address?.message}
            hint="Calle, número y barrio."
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <Input
                id="sd-address"
                className="pl-9"
                invalid={!!addressForm.formState.errors.address}
                {...addressForm.register("address")}
              />
            </div>
          </FormField>

          <FormField
            label={`Radio de entrega · ${radius} km`}
            htmlFor="sd-radius"
          >
            <input
              id="sd-radius"
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              className="w-full accent-primary-600"
              {...addressForm.register("deliveryRadiusKm", { valueAsNumber: true })}
            />
            <div className="flex justify-between text-body-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>0.5 km</span>
              <span>20 km</span>
            </div>
          </FormField>

          {serverErrorAddress && (
            <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
              {serverErrorAddress}
            </p>
          )}

          <Button type="submit" loading={pendingAddress}>
            Guardar ubicación
          </Button>
        </form>
      </section>
    </div>
  );
}
