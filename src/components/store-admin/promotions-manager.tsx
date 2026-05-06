"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Tag, X, Percent, DollarSign, Truck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { createPromotionAction, togglePromotionAction, deletePromotionAction } from "@/server/actions/stores";

type Promotion = {
  id: string;
  code: string;
  type: "percent" | "amount" | "free_delivery";
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type Props = {
  storeId: string;
  initial: Promotion[];
};

const createSchema = z.object({
  code: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres").toUpperCase(),
  type: z.enum(["percent", "amount", "free_delivery"]),
  value: z.coerce.number().min(0, "Valor mínimo 0"),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export function PromotionsManager({ storeId, initial }: Props) {
  const [promotions, setPromotions] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: "",
      type: "percent",
      value: 0,
      minOrderAmount: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof createSchema>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createPromotionAction({
        storeId,
        ...data,
      });
      if (result?.serverError) {
        setError(result.serverError);
      } else {
        setShowForm(false);
        form.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear promoción");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      await togglePromotionAction({
        storeId,
        promotionId: promo.id,
        active: !promo.is_active,
      });
      setPromotions(promotions.map(p => 
        p.id === promo.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const deletePromo = async (promo: Promotion) => {
    if (!confirm(`¿Eliminar la promoción ${promo.code}?`)) return;
    try {
      await deletePromotionAction({ storeId, promotionId: promo.id });
      setPromotions(promotions.filter(p => p.id !== promo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percent": return <Percent className="size-4" />;
      case "amount": return <DollarSign className="size-4" />;
      case "free_delivery": return <Truck className="size-4" />;
      default: return <Tag className="size-4" />;
    }
  };

  const formatValue = (promo: Promotion) => {
    switch (promo.type) {
      case "percent": return `${promo.value}%`;
      case "amount": return `$${promo.value}`;
      case "free_delivery": return "Envío gratis";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100">
            Promociones activas
          </h2>
          <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gestiona los códigos de descuento y ofertas especiales.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nueva promoción"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Código"
                htmlFor="promo-code"
                error={form.formState.errors.code?.message}
                hint="El cliente ingresa este código al pagar"
              >
                <Input
                  id="promo-code"
                  placeholder="DESCUENTO20"
                  {...form.register("code")}
                  onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                />
              </FormField>

              <FormField label="Tipo de descuento" htmlFor="promo-type">
                <select
                  id="promo-type"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                  {...form.register("type")}
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="amount">Monto fijo ($)</option>
                  <option value="free_delivery">Envío gratis</option>
                </select>
              </FormField>

              {form.watch("type") !== "free_delivery" && (
                <FormField
                  label="Valor"
                  htmlFor="promo-value"
                  error={form.formState.errors.value?.message}
                >
                  <Input
                    id="promo-value"
                    type="number"
                    min="0"
                    {...form.register("value")}
                  />
                </FormField>
              )}

              <FormField
                label="Monto mínimo del pedido"
                htmlFor="promo-min"
                hint="Opcional"
              >
                <Input
                  id="promo-min"
                  type="number"
                  min="0"
                  {...form.register("minOrderAmount")}
                />
              </FormField>

              <FormField
                label="Fecha de inicio"
                htmlFor="promo-start"
                hint="Opcional"
              >
                <Input
                  id="promo-start"
                  type="datetime-local"
                  {...form.register("startsAt")}
                />
              </FormField>

              <FormField
                label="Fecha de expiración"
                htmlFor="promo-end"
                hint="Opcional"
              >
                <Input
                  id="promo-end"
                  type="datetime-local"
                  {...form.register("endsAt")}
                />
              </FormField>
            </div>

            {error && (
              <p className="text-body-sm text-destructive">{error}</p>
            )}

            <Button type="submit" loading={loading}>
              Crear promoción
            </Button>
          </form>
        </div>
      )}

      {promotions.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Tag className="size-12 mx-auto mb-3 opacity-30" />
          <p>No hay promociones creadas</p>
          <p className="text-body-sm mt-1">Creá tu primera promoción para atraer clientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                promo.is_active 
                  ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700" 
                  : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${promo.is_active ? "bg-primary-100 dark:bg-primary-900 text-primary dark:text-primary-300" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"}`}>
                  {getTypeIcon(promo.type)}
                </div>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{promo.code}</p>
                  <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
                    {formatValue(promo)}
                    {promo.min_order_amount > 0 && ` • Mín. $${promo.min_order_amount}`}
                    {promo.max_uses && ` • ${promo.uses_count}/${promo.max_uses} usos`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(promo)}
                  className={`text-body-sm ${promo.is_active ? "text-green-600 dark:text-green-400" : "text-neutral-400 dark:text-neutral-500"}`}
                >
                  {promo.is_active ? "Activa" : "Inactiva"}
                </button>
                <button
                  onClick={() => deletePromo(promo)}
                  className="text-neutral-400 hover:text-destructive dark:text-neutral-500 dark:hover:text-red-400"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}