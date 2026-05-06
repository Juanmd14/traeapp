"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Package,
  Search, Check, EyeOff, X,
} from "lucide-react";
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

type QuantityOptionInput = {
  quantity: number;
  price: number;
  isDefault: boolean;
};

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

type FilterType = "all" | "available" | "unavailable";

export function ProductsManager({ storeId, initial }: Props) {
  const [products, setProducts] = useState<ProductRow[]>(initial);
  const [editingProduct, setEditingProduct] = useState<ProductRow | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = products.filter((p) => {
    const matchSearch =
      search.length < 2 ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "available" && p.is_available) ||
      (filter === "unavailable" && !p.is_available);
    return matchSearch && matchFilter;
  });

  const availableCount = products.filter((p) => p.is_available).length;
  const unavailableCount = products.length - availableCount;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Productos
          </h1>
          <div className="flex items-center gap-3 mt-1 text-body-sm text-neutral-500">
            <span>{products.length} en total</span>
            <span>·</span>
            <span className="text-accent-600 font-medium">
              {availableCount} disponibles
            </span>
            {unavailableCount > 0 && (
              <>
                <span>·</span>
                <span className="text-neutral-400">{unavailableCount} ocultos</span>
              </>
            )}
          </div>
        </div>
        <Button onClick={() => setEditingProduct("new")}>
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      {/* Filtros + búsqueda — solo si hay productos suficientes */}
      {products.length > 3 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input
                type="search"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-100 rounded-lg text-body-md placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>
          </div>
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden shrink-0">
            {(["all", "available", "unavailable"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-2 text-body-sm font-medium transition",
                  filter === f
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {f === "all"
                  ? "Todos"
                  : f === "available"
                    ? "Disponibles"
                    : "Ocultos"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-body-md text-neutral-500">
            Sin resultados para "{search}"
          </p>
          <button
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="text-body-sm text-primary-600 hover:underline mt-1"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <ProductListRow
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onDeleted={handleDeleted}
              onAvailabilityChange={handleAvailabilityChange}
              storeId={storeId}
            />
          ))}
        </div>
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

function ProductListRow({
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
    onAvailabilityChange(product.id, next);
    startTransition(async () => {
      const result = await toggleProductAvailabilityAction({
        storeId,
        productId: product.id,
        isAvailable: next,
      });
      if (result?.serverError) {
        onAvailabilityChange(product.id, !next);
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

  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition hover:border-neutral-300",
        !product.is_available && "opacity-60",
      )}
    >
      {/* Imagen */}
      <div className="size-16 sm:size-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0 relative">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <Package className="size-6 text-primary-400" />
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-neutral-900/40 flex items-center justify-center">
            <EyeOff className="size-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-body-md font-semibold text-neutral-900 truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-body-sm text-neutral-500 line-clamp-1 mt-0.5">
            {product.description}
          </p>
        )}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-body-md font-bold text-neutral-900">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-body-xs text-neutral-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <Switch
            checked={product.is_available}
            onCheckedChange={onToggleAvailable}
            disabled={isPending}
          />
          <span
            className={cn(
              "text-body-xs font-medium hidden sm:block transition",
              product.is_available ? "text-accent-600" : "text-neutral-400",
            )}
          >
            {product.is_available ? "Activo" : "Oculto"}
          </span>
        </label>

        <button
          onClick={onEdit}
          className="size-9 sm:size-8 rounded-md hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
          aria-label="Editar"
        >
          <Pencil className="size-4" />
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1.5 sm:gap-1 bg-red-50 rounded-lg px-2.5 py-1.5 sm:px-2 sm:py-1">
            <span className="text-body-xs text-neutral-600">¿Borrar?</span>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="text-body-xs font-semibold text-destructive hover:underline min-w-fit"
            >
              Sí
            </button>
            <span className="text-neutral-300">|</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-body-xs font-medium text-neutral-500 hover:underline min-w-fit"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="size-9 sm:size-8 rounded-md hover:bg-red-50 flex items-center justify-center text-neutral-500 hover:text-destructive transition"
            aria-label="Borrar"
          >
            <Trash2 className="size-4" />
          </button>
        )}
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
  const [imagePreview, setImagePreview] = useState<string>(
    initial?.image_url ?? "",
  );
  const [quantityOptions, setQuantityOptions] = useState<QuantityOptionInput[]>([]);
  const [hasQuantityOptions, setHasQuantityOptions] = useState(false);
  const [hideManualQuantity, setHideManualQuantity] = useState(false);
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
          const product = result.data.product as { id: string };
          onSaved(
            {
              id: product.id,
              name: data.name,
              description: data.description ?? null,
              image_url: imagePreview || null,
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
          {/* Preview de imagen */}
          {imagePreview && (
            <div className="relative w-full h-36 rounded-lg overflow-hidden bg-neutral-100">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                onError={() => setImagePreview("")}
              />
              <button
                type="button"
                onClick={() => setImagePreview("")}
                className="absolute top-2 right-2 size-6 bg-white/90 rounded-full flex items-center justify-center text-neutral-600 hover:text-destructive transition shadow-sm"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}

          <FormField
            label="URL de imagen"
            htmlFor="imageUrl"
            hint="Pegá un link de imagen (opcional)"
          >
            <Input
              id="imageUrl"
              placeholder="https://ejemplo.com/foto.jpg"
              value={imagePreview}
              onChange={(e) => setImagePreview(e.target.value)}
            />
          </FormField>

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

          <FormField
            label="Descripción"
            htmlFor="description"
            hint="Ingredientes o detalles. Se ve en la ficha del comercio."
          >
            <Input
              id="description"
              placeholder="Ej: con muzzarella extra y aceitunas..."
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
                    setValueAs: (v) =>
                      v === "" || v == null ? undefined : Number(v),
                  })}
                />
              </div>
            </FormField>
          </div>

          {/* Toggle disponibilidad mejorado */}
          <label className="flex items-center gap-3 cursor-pointer select-none bg-neutral-50 rounded-lg px-3 py-3">
            <Switch
              checked={form.watch("isAvailable")}
              onCheckedChange={(v) => form.setValue("isAvailable", v)}
            />
            <div>
              <p className="text-body-md font-medium text-neutral-900">
                Disponible para pedir
              </p>
              <p className="text-body-xs text-neutral-500">
                {form.watch("isAvailable")
                  ? "Los clientes pueden agregar este producto al carrito"
                  : "Temporalmente oculto en la app"}
              </p>
            </div>
          </label>

          {/* Quantity Options - solo para productos por cantidad */}
          <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <Switch
                checked={hasQuantityOptions}
                onCheckedChange={(v) => setHasQuantityOptions(v)}
              />
              <div>
                <p className="text-body-md font-medium text-neutral-900">
                  Tiene cantidades predefinidas
                </p>
                <p className="text-body-xs text-neutral-500">
                  Ej: media docena (6), docena (12). No usa selector manual
                </p>
              </div>
            </label>

            {hasQuantityOptions && quantityOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-body-sm font-medium text-neutral-700">
                  Opciones de cantidad:
                </p>
                <div className="space-y-2">
                  {quantityOptions.map((opt: QuantityOptionInput, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={opt.quantity}
                        onChange={(e) => {
                          const newOpts = [...quantityOptions];
                          if (newOpts[idx]) {
                            newOpts[idx].quantity = parseInt(e.target.value) || 1;
                            setQuantityOptions(newOpts);
                          }
                        }}
                        className="w-20 px-2 py-1.5 border border-neutral-200 rounded-md text-body-sm"
                        placeholder="Cant."
                      />
                      <span className="text-neutral-400">unidades</span>
                      <span className="text-neutral-500">x</span>
                      <div className="relative flex-1 max-w-32">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          value={opt.price}
                          onChange={(e) => {
                            const newOpts = [...quantityOptions];
                            if (newOpts[idx]) {
                              newOpts[idx].price = parseInt(e.target.value) || 0;
                              setQuantityOptions(newOpts);
                            }
                          }}
                          className="w-full pl-6 py-1.5 border border-neutral-200 rounded-md text-body-sm"
                          placeholder="Precio"
                        />
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="defaultQty"
                          checked={opt.isDefault}
                          onChange={() => {
                            const newOpts = quantityOptions.map((o: QuantityOptionInput, i: number) => ({
                              ...o,
                              isDefault: i === idx,
                            }));
                            setQuantityOptions(newOpts);
                          }}
                          className="accent-primary-600"
                        />
                        <span className="text-body-xs text-neutral-500">Por defecto</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuantityOptions(quantityOptions.filter((_: QuantityOptionInput, i: number) => i !== idx));
                        }}
                        className="text-neutral-400 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuantityOptions([
                      ...quantityOptions,
                      { quantity: 1, price: 0, isDefault: quantityOptions.length === 0 },
                    ]);
                  }}
                  className="text-body-sm text-primary-600 hover:underline"
                >
                  + Agregar opción
                </button>
              </div>
            )}

            {hasQuantityOptions && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideManualQuantity}
                  onChange={(e) => setHideManualQuantity(e.target.checked)}
                  className="accent-primary-600"
                />
                <span className="text-body-sm text-neutral-600">
                  Ocultar selector manual de cantidad
                </span>
              </label>
            )}
          </div>

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
            <Button type="submit" loading={isPending} fullWidth variant="success">
              <Check className="size-4" />
              {isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}