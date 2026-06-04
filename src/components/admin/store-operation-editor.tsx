"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { storeOperationSchema, type StoreOperationInput } from "@/schemas";
import { updateStoreOperationAction } from "@/server/actions/stores";
import { formatPrice } from "@/lib/utils";

type Props = {
  storeId: string;
  initial: StoreOperationInput;
};

export function StoreOperationEditor({ storeId, initial }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const form = useForm<StoreOperationInput>({
    resolver: zodResolver(storeOperationSchema),
    defaultValues: initial,
  });

  const onSubmit = (data: StoreOperationInput) => {
    setServerError(null);
    setFeedback(null);
    start(async () => {
      const result = await updateStoreOperationAction({ ...data, storeId });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setFeedback("Operación actualizada.");
      router.refresh();
    });
  };

  const fee = form.watch("deliveryFee");
  const minOrder = form.watch("minOrderAmount");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label="Costo de envío"
          htmlFor="op-deliveryFee"
          error={form.formState.errors.deliveryFee?.message}
          hint={fee === 0 ? "Envío gratis" : `Se muestra como ${formatPrice(fee)}`}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-body-md">$</span>
            <Input
              id="op-deliveryFee"
              type="number"
              min="0"
              step="50"
              className="pl-7"
              {...form.register("deliveryFee", { valueAsNumber: true })}
            />
          </div>
        </FormField>

        <FormField
          label="Pedido mínimo"
          htmlFor="op-minOrderAmount"
          error={form.formState.errors.minOrderAmount?.message}
          hint={minOrder === 0 ? "Sin mínimo" : `Mínimo ${formatPrice(minOrder)}`}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-body-md">$</span>
            <Input
              id="op-minOrderAmount"
              type="number"
              min="0"
              step="100"
              className="pl-7"
              {...form.register("minOrderAmount", { valueAsNumber: true })}
            />
          </div>
        </FormField>
      </div>

      <FormField
        label="Tiempo promedio de preparación"
        htmlFor="op-avgPrepMinutes"
        error={form.formState.errors.avgPrepMinutes?.message}
        hint="Cuánto tarda en promedio preparar un pedido."
      >
        <div className="relative">
          <Input
            id="op-avgPrepMinutes"
            type="number"
            min="5"
            max="180"
            step="5"
            className="pr-12"
            {...form.register("avgPrepMinutes", { valueAsNumber: true })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-body-md">min</span>
        </div>
      </FormField>

      <div>
        <p className="text-body-sm font-medium text-neutral-700 mb-3">Métodos de pago aceptados</p>
        <div className="space-y-2">
          <Controller
            name="acceptsCash"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-md cursor-pointer hover:border-neutral-300 transition">
                <div className="flex items-center gap-3">
                  <div className="size-9 bg-accent-100 text-accent-700 rounded-md flex items-center justify-center">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-neutral-900">Efectivo</p>
                    <p className="text-body-xs text-neutral-500">Cobra al entregar el pedido</p>
                  </div>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />

          <Controller
            name="acceptsMp"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-md cursor-pointer hover:border-neutral-300 transition">
                <div className="flex items-center gap-3">
                  <div className="size-9 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-neutral-900">Mercado Pago</p>
                    <p className="text-body-xs text-neutral-500">Cliente paga online antes de recibir</p>
                  </div>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />
        </div>
      </div>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">{serverError}</p>
      )}
      {feedback && (
        <p className="text-body-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md">{feedback}</p>
      )}

      <Button type="submit" loading={pending}>
        Guardar operación
      </Button>
    </form>
  );
}
