"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, LogOut, MapPin, ClipboardList, ChevronRight, Store } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { updateProfileAction, uploadAvatarAction } from "@/server/actions/profile";
import { logoutAction } from "@/server/actions/auth";

const formSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre").max(80),
  phone: z.string().optional().or(z.literal("")),
});

type FormInput = z.infer<typeof formSchema>;

type Props = {
  initial: {
    fullName: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
  };
};

export function ProfileForm({ initial }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, startUploadingAvatar] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initial.fullName,
      phone: initial.phone ?? "",
    },
  });

  const onSubmit = (data: FormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateProfileAction(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setServerError("La imagen es muy grande (máx 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      startUploadingAvatar(async () => {
        const result = await uploadAvatarAction({ avatarBase64: dataUrl });
        if (result?.serverError) {
          setServerError(result.serverError);
          return;
        }
        if (result?.data?.url) {
          setAvatarUrl(result.data.url);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="container-shop py-5 space-y-6">
      {/* Avatar */}
      <section className="flex flex-col items-center pt-2 pb-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="relative size-24 rounded-full overflow-hidden bg-primary-100 group disabled:opacity-60"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Tu avatar"
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-primary-700 text-display-md font-bold">
                {initial.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            {isUploadingAvatar ? (
              <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
                <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 size-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-primary-sm transition"
            aria-label="Cambiar foto"
          >
            <Camera className="size-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <p className="text-body-md font-medium text-neutral-900 mt-3">
          {initial.fullName}
        </p>
        {initial.email && (
          <p className="text-body-sm text-neutral-500">{initial.email}</p>
        )}
      </section>

      {/* Form datos personales */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-heading-sm font-semibold text-neutral-900">
          Datos personales
        </h2>

        <FormField
          label="Nombre completo"
          htmlFor="fullName"
          required
          error={form.formState.errors.fullName?.message}
        >
          <Input
            id="fullName"
            invalid={!!form.formState.errors.fullName}
            {...form.register("fullName")}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="email"
          hint="No se puede cambiar"
        >
          <Input
            id="email"
            type="email"
            disabled
            value={initial.email ?? ""}
            className="bg-neutral-100 dark:bg-neutral-800"
          />
        </FormField>

        <FormField
          label="Teléfono"
          htmlFor="phone"
          error={form.formState.errors.phone?.message}
          hint="Opcional. El comercio puede contactarte por acá."
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+54 9 381 123-4567"
            {...form.register("phone")}
          />
        </FormField>

        {serverError && (
          <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
            {serverError}
          </p>
        )}

        {savedFlash && (
          <p className="text-body-sm text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/30 px-3 py-2 rounded-md">
            ✓ Guardado
          </p>
        )}

        <Button type="submit" loading={isPending} fullWidth size="lg">
          Guardar cambios
        </Button>
      </form>

      {/* Atajos */}
      <section className="space-y-2">
        <h2 className="text-heading-sm font-semibold text-neutral-900">
          Más opciones
        </h2>
        <Link
          href="/pedidos"
          className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 bg-primary-100 text-primary-700 rounded-md flex items-center justify-center">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-body-md font-medium text-neutral-900">Mis pedidos</p>
              <p className="text-body-xs text-neutral-500">Historial y pedidos en curso</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-neutral-400" />
        </Link>

        <Link
          href="/direcciones"
          className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 bg-accent-100 text-accent-700 rounded-md flex items-center justify-center">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-body-md font-medium text-neutral-900">Mis direcciones</p>
              <p className="text-body-xs text-neutral-500">Direcciones guardadas</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-neutral-400" />
        </Link>

        {(initial.role === "store_owner" || initial.role === "store_staff" || initial.role === "admin") && (
          <Link
            href="/comercio/pedidos"
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 bg-warning-100 text-warning-700 rounded-md flex items-center justify-center">
                <Store className="size-5" />
              </div>
              <div>
                <p className="text-body-md font-medium text-neutral-900">Panel del comercio</p>
                <p className="text-body-xs text-neutral-500">Pedidos, productos y más</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </Link>
        )}
      </section>

      {/* Logout */}
      <section className="pt-2">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-body-md font-medium text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900 transition"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
