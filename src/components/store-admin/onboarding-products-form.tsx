"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { productSchema, type ProductInput } from "@/schemas";
import { createProductAction } from "@/server/actions/products";
import { formatPrice } from "@/lib/utils";

type Product = { id: string; name: string; price: number };

type Props = { storeId: string };

export function OnboardingProductsForm({ storeId }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      isAvailable: true,
    },
  });

  const onAdd = (data: ProductInput) => {
    setServerError(null);
    setIsAdding(true);
    startTransition(async () => {
      const result = await createProductAction({ ...data, storeId });
      if (result?.serverError) {
        setServerError(result.serverError);
        setIsAdding(false);
        return;
      }
      if (result?.data?.product) {
        const product = result.data.product as {
          id: string;
          name: string;
          price: number;
        };
      
        setProducts((prev) => [
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
          },
          ...prev,
        ]);
      
        form.reset();
      }
      setIsAdding(false);
    });
  };

  const onContinue = () => {
    if (products.length === 0) {
      setServerError("Cargá al menos un producto antes de continuar");
      return;
    }
    router.push(`/comercio/onboarding/publicar?storeId=${storeId}`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
      {/* Form de carga rápida */}
      <div>
        <h2 className="text-heading-md font-semibold mb-3">
          Agregar producto
        </h2>
        <form onSubmit={form.handleSubmit(onAdd)} className="space-y-4">
          <FormField
            label="Nombre"
            htmlFor="name"
            required
            error={form.formState.errors.name?.message}
          >
            <Input
              id="name"
              placeholder="Ej: Pizza muzzarella"
              invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
          </FormField>

          <FormField
            label="Descripción"
            htmlFor="description"
            error={form.formState.errors.description?.message}
            hint="Ingredientes o detalle. Opcional."
          >
            <Input
              id="description"
              placeholder="Salsa de tomate, queso, oregano"
              {...form.register("description")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Precio"
              htmlFor="price"
              required
              error={form.formState.errors.price?.message}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-body-md">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="50"
                  className="pl-7"
                  invalid={!!form.formState.errors.price}
                  {...form.register("price", { valueAsNumber: true })}
                />
              </div>
            </FormField>

            <FormField
              label="Precio anterior"
              htmlFor="compareAtPrice"
              hint="Si lo ponés se muestra tachado"
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-body-md">
                  $
                </span>
                <Input
                  id="compareAtPrice"
                  type="number"
                  min="0"
                  step="50"
                  className="pl-7"
                  {...form.register("compareAtPrice", {
                    setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
                  })}
                />
              </div>
            </FormField>
          </div>

          {serverError && (
            <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
              {serverError}
            </p>
          )}

          <Button type="submit" fullWidth loading={isAdding} variant="dark">
            <Plus className="size-4" />
            Agregar producto
          </Button>
        </form>
      </div>

      {/* Lista de productos cargados */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-heading-md font-semibold">
            Productos cargados
          </h2>
          <span className="text-body-sm text-neutral-500">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
            <Package className="size-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-body-md text-neutral-500">
              Todavía no cargaste productos.
            </p>
            <p className="text-body-sm text-neutral-400 mt-1">
              Empezá con los más vendidos. Después podés sumar más.
            </p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 bg-white border border-neutral-200 rounded-md p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-neutral-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-body-sm text-neutral-500">
                    {formatPrice(p.price)}
                  </p>
                </div>
                {/* TODO: agregar delete inline */}
              </li>
            ))}
          </ul>
        )}

        <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mt-4">
          <p className="text-body-sm text-warning-900">
            <strong className="font-medium">Tip:</strong> empezá con 5–10 productos
            estrella. Después podés sumar más desde el panel sin límites.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2 flex justify-between pt-4 border-t border-neutral-200">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Volver
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          loading={isPending}
          disabled={products.length === 0}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
