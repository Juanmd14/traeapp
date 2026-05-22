"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { storeAddressSchema, type StoreAddressInput } from "@/schemas";
import { updateStoreAddressAction } from "@/server/actions/stores";

type Props = { storeId: string };

export function OnboardingAddressForm({ storeId }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StoreAddressInput>({
    resolver: zodResolver(storeAddressSchema),
    defaultValues: {
      address: "",
      deliveryRadiusKm: 5,
    },
  });

  const onSubmit = (data: StoreAddressInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateStoreAddressAction({ ...data, storeId });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.push(`/comercio/onboarding/operacion?storeId=${storeId}`);
    });
  };

  const radius = form.watch("deliveryRadiusKm");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <FormField
        label="Dirección del comercio"
        htmlFor="address"
        required
        error={form.formState.errors.address?.message}
        hint="Calle, número y barrio. Esta es la dirección desde donde sale el delivery."
      >
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
          <Input
            id="address"
            autoFocus
            placeholder="Av. San Martín 450"
            className="pl-9"
            invalid={!!form.formState.errors.address}
            {...form.register("address")}
          />
        </div>
      </FormField>

      <FormField
        label={`Radio de entrega · ${radius} km`}
        htmlFor="deliveryRadiusKm"
        hint="Hasta qué distancia entregás. En ciudad chica 3-5 km cubre casi todo."
      >
        <input
          id="deliveryRadiusKm"
          type="range"
          min="0.5"
          max="20"
          step="0.5"
          className="w-full accent-primary-600"
          {...form.register("deliveryRadiusKm", { valueAsNumber: true })}
        />
        <div className="flex justify-between text-body-xs text-neutral-500 mt-1">
          <span>0.5 km</span>
          <span>20 km</span>
        </div>
      </FormField>

      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
        <p className="text-body-sm text-neutral-700">
          <strong className="font-medium">Tip:</strong> más adelante vas a poder ajustar
          el costo de envío por distancia. Por ahora dejá el radio aproximado.
        </p>
      </div>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Volver
        </Button>
        <Button type="submit" size="lg" loading={isPending}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
