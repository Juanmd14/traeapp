"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { productSchema, type ProductInput } from "@/schemas";
import {
  createProductAction,
  updateProductAction,
  toggleProductAvailabilityAction,
  deleteProductAction,
} from "@/server/actions/products";
import { formatPrice, cn } from "@/lib/utils";

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  compare_at_price: number | null;
  is_available: boolean;
  product_category_id: string | null;
};

type Props = {
  storeId: string;
  initial: ProductRow[];
};

export function ProductsManager({ storeId, initial }: Props) {
  const [products, setProducts] = useState<ProductRow[]>(initial);
  const [editingProduct, setEditingProduct] = useState<ProductRow | "new" | null>(null);

  const handleSaved = (saved: ProductRow, isNew: boolean) => {
    setProducts((prev) =>
      isNew ? [saved, ...prev] : prev.map((p) => (p.id === saved.id ? saved : p)),
    );
    setEditingProduct(null);
  };

  const handleDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAvailabilityChange = (id: string, available: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_available: available } : p)),
    );
  };

  return (
    <div>
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Productos
          </h1>
          <p className="text-body-md text-neutral-500 mt-0.5">
            {products.length} {products.length === 1 ? "producto" : "productos"} en tu menú
          </p>
        </div>
        <Button onClick={() => setEditingProduct("new")}>
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </header>

      {products.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <div className="size-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="size-6 text-neutral-400" />
          </div>
          <h2 className="text-heading-sm font-medium text-neutral-900 mb-1">
            Aún no tenés productos
          </h2>
          <p className="text-body-md text-neutral-500 mb-5">
            Agregá tu primer producto para que aparezca en el marketplace.
          </p>
          <Button onClick={() => setEditingProduct("new")}>
            <Plus className="size-4" />
            Agregar producto
          </Button>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                onEdit={() => setEditingProduct(product)}
                onDeleted={handleDeleted}
                onAvailabilityChange={handleAvailabilityChange}
                storeId={storeId}
              />
            </li>
          ))}
        </ul>
      )}

      {editingProduct && (
        <ProductFormDialog
          storeId={storeId}
          initial={editingProduct === "new" ? null : editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onDeleted,
  onAvailabilityChange,
  storeId,
}: {
  product: ProductRow;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  onAvailabilityChange: (id: string, available: boolean) => void;
  storeId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onToggleAvailable = (next: boolean) => {
    onAvailabilityChange(product.id, next); // optimista
    startTransition(async () => {
      const result = await toggleProductAvailabilityAction({
        storeId,
        productId: product.id,
        isAvailable: next,
      });
      if (result?.serverError) {
        onAvailabilityChange(product.id, !next); // revertir
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteProductAction({
        storeId,
        productId: product.id,
      });
      if (result?.data?.ok) onDeleted(product.id);
    });
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 rounded-md overflow-hidden transition",
        !product.is_available && "opacity-60",
      )}
    >
      <div className="relative aspect-[4/3] bg-neutral-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width:640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-300 flex items-center justify-center">
            <Package className="size-8 text-primary-700/50" />
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-neutral-900/40 flex items-center justify-center">
            <span className="bg-white text-neutral-900 text-body-sm font-medium px-3 py-1 rounded-full">
              Sin stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-body-md font-medium text-neutral-900 truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-body-sm text-neutral-500 line-clamp-1">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-body-md font-semibold text-neutral-900">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-body-xs text-neutral-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Switch
              checked={product.is_available}
              onCheckedChange={onToggleAvailable}
              disabled={isPending}
            />
            <span className="text-body-xs text-neutral-600">Disponible</span>
          </label>

          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="size-8 rounded-md hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
              aria-label="Editar"
            >
              <Pencil className="size-4" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1 text-body-xs">
                <button
                  onClick={onDelete}
                  disabled={isPending}
                  className="font-medium text-destructive px-2 py-1 hover:underline"
                >
                  ¿Borrar?
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-neutral-500 px-2 py-1 hover:underline"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="size-8 rounded-md hover:bg-red-50 flex items-center justify-center text-neutral-500 hover:text-destructive transition"
                aria-label="Borrar"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormDialog({
  storeId,
  initial,
  onClose,
  onSaved,
}: {
  storeId: string;
  initial: ProductRow | null;
  onClose: () => void;
  onSaved: (p: ProductRow, isNew: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initial;

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      compareAtPrice: initial?.compare_at_price ?? undefined,
      isAvailable: initial?.is_available ?? true,
    },
  });

  const onSubmit = (data: ProductInput) => {
    setServerError(null);
    startTransition(async () => {
      if (isEditing && initial) {
        const result = await updateProductAction({
          ...data,
          storeId,
          productId: initial.id,
        });
        if (result?.serverError) {
          setServerError(result.serverError);
          return;
        }
        onSaved(
          {
            ...initial,
            name: data.name,
            description: data.description ?? null,
            price: data.price,
            compare_at_price: data.compareAtPrice ?? null,
            is_available: data.isAvailable,
          },
          false,
        );
      } else {
        const result = await createProductAction({ ...data, storeId });
        if (result?.serverError) {
          setServerError(result.serverError);
          return;
        }
        if (result?.data?.product) {
          onSaved(
            {
              id: result.data.product.id,
              name: data.name,
              description: data.description ?? null,
              image_url: null,
              price: data.price,
              compare_at_price: data.compareAtPrice ?? null,
              is_available: data.isAvailable,
              product_category_id: null,
            },
            true,
          );
        }
      }
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Nombre"
            htmlFor="name"
            required
            error={form.formState.errors.name?.message}
          >
            <Input
              id="name"
              autoFocus
              invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
          </FormField>

          <FormField label="Descripción" htmlFor="description">
            <Input
              id="description"
              placeholder="Ingredientes, detalles..."
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
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
              hint="Tachado, opcional"
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
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

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...form.register("isAvailable")}
              className="size-4 rounded text-primary-600"
            />
            <span className="text-body-md text-neutral-700">
              Disponible para pedir
            </span>
          </label>

          {serverError && (
            <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">
              {serverError}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="ghost" fullWidth type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" loading={isPending} fullWidth>
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
