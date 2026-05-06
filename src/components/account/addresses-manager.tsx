"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin, Plus, Pencil, Trash2, Star, Check, Home, Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/server/actions/addresses";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  street: z.string().min(2, "Calle requerida").max(120),
  number: z.string().max(20).optional().or(z.literal("")),
  apartment: z.string().max(20).optional().or(z.literal("")),
  neighborhood: z.string().max(80).optional().or(z.literal("")),
  reference: z.string().max(200).optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});
type FormInput = z.infer<typeof formSchema>;

export type AddressItem = {
  id: string;
  label: string | null;
  street: string;
  number: string | null;
  apartment: string | null;
  neighborhood: string | null;
  reference: string | null;
  city: string;
  is_default: boolean;
};

type Props = {
  initial: AddressItem[];
};

export function AddressesManager({ initial }: Props) {
  const [addresses, setAddresses] = useState<AddressItem[]>(initial);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  const handleSaved = (updated: AddressItem) => {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === updated.id);
      let next = idx >= 0
        ? prev.map((a) => (a.id === updated.id ? updated : a))
        : [...prev, updated];
      // Si es default, marcar las demás como no-default
      if (updated.is_default) {
        next = next.map((a) =>
          a.id === updated.id ? a : { ...a, is_default: false },
        );
      }
      return next;
    });
    setEditingId(null);
  };

  const handleDeleted = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id })),
    );
  };

  return (
    <div className="container-shop py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Mis direcciones
        </h1>
        {editingId !== "new" && (
          <Button size="sm" onClick={() => setEditingId("new")}>
            <Plus className="size-4" />
            Nueva
          </Button>
        )}
      </div>

      {/* Form de nueva */}
      {editingId === "new" && (
        <AddressForm
          onCancel={() => setEditingId(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Lista */}
      {addresses.length === 0 && editingId !== "new" ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-10 text-center">
          <div className="size-14 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="size-6 text-neutral-400" />
          </div>
          <h2 className="text-heading-sm font-medium text-neutral-900 mb-1">
            No tenés direcciones guardadas
          </h2>
          <p className="text-body-md text-neutral-500 mb-5">
            Agregá tu primera dirección para hacer pedidos más rápido.
          </p>
          <Button onClick={() => setEditingId("new")}>
            <Plus className="size-4" />
            Agregar dirección
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {addresses.map((addr) => (
            <li key={addr.id}>
              {editingId === addr.id ? (
                <AddressForm
                  initial={addr}
                  onCancel={() => setEditingId(null)}
                  onSaved={handleSaved}
                />
              ) : (
                <AddressCard
                  address={addr}
                  onEdit={() => setEditingId(addr.id)}
                  onDeleted={handleDeleted}
                  onSetDefault={handleSetDefault}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDeleted,
  onSetDefault,
}: {
  address: AddressItem;
  onEdit: () => void;
  onDeleted: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteAddressAction({ id: address.id });
      if (result?.data?.ok) onDeleted(address.id);
    });
  };

  const onMakeDefault = () => {
    startTransition(async () => {
      const result = await setDefaultAddressAction({ id: address.id });
      if (result?.data?.ok) onSetDefault(address.id);
    });
  };

  const Icon = address.label?.toLowerCase().includes("trabajo") ? Briefcase : Home;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "size-9 rounded-md flex items-center justify-center shrink-0",
            address.is_default
              ? "bg-primary-100 text-primary-700"
              : "bg-neutral-100 text-neutral-500",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-body-md font-medium text-neutral-900">
              {address.label || "Dirección"}
            </p>
            {address.is_default && (
              <span className="bg-primary-100 text-primary-700 text-body-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Star className="size-3 fill-current" />
                Predeterminada
              </span>
            )}
          </div>
          <p className="text-body-sm text-neutral-700 mt-0.5">
            {address.street}{address.number ? ` ${address.number}` : ""}
            {address.apartment ? `, ${address.apartment}` : ""}
          </p>
          {address.neighborhood && (
            <p className="text-body-xs text-neutral-500 mt-0.5">
              {address.neighborhood}
            </p>
          )}
          {address.reference && (
            <p className="text-body-xs text-neutral-500 mt-1 italic">
              "{address.reference}"
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onEdit}
              className="text-body-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <Pencil className="size-3.5" />
              Editar
            </button>
            {!address.is_default && (
              <button
                onClick={onMakeDefault}
                disabled={isPending}
                className="text-body-sm font-medium text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Star className="size-3.5" />
                Hacer predeterminada
              </button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 text-body-sm">
                <span className="text-neutral-600">¿Seguro?</span>
                <button
                  onClick={onDelete}
                  disabled={isPending}
                  className="font-medium text-destructive hover:underline"
                >
                  Sí, borrar
                </button>
                <span className="text-neutral-400">·</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-medium text-neutral-600 hover:underline"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-body-sm font-medium text-destructive hover:text-red-700 inline-flex items-center gap-1"
              >
                <Trash2 className="size-3.5" />
                Borrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: AddressItem;
  onCancel: () => void;
  onSaved: (a: AddressItem) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initial;

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: initial?.label ?? "",
      street: initial?.street ?? "",
      number: initial?.number ?? "",
      apartment: initial?.apartment ?? "",
      neighborhood: initial?.neighborhood ?? "",
      reference: initial?.reference ?? "",
      isDefault: initial?.is_default ?? false,
    },
  });

  const onSubmit = (data: FormInput) => {
    setServerError(null);
    startTransition(async () => {
      if (isEditing && initial) {
        const result = await updateAddressAction({ ...data, id: initial.id });
        if (result?.serverError) {
          setServerError(result.serverError);
          return;
        }
        onSaved({
          ...initial,
          label: data.label || null,
          street: data.street,
          number: data.number || null,
          apartment: data.apartment || null,
          neighborhood: data.neighborhood || null,
          reference: data.reference || null,
          is_default: data.isDefault,
        });
      } else {
        const result = await createAddressAction(data);
        if (result?.serverError) {
          setServerError(result.serverError);
          return;
        }
        if (result?.data?.address) {
          onSaved(result.data.address as unknown as AddressItem);
        }
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="bg-white dark:bg-neutral-900 border-2 border-primary-200 dark:border-primary-900 rounded-md p-4 space-y-4"
    >
      <h2 className="text-heading-sm font-semibold text-neutral-900">
        {isEditing ? "Editar dirección" : "Nueva dirección"}
      </h2>

      <FormField
        label="Etiqueta"
        htmlFor="label"
        hint="Opcional. Ej: Casa, Trabajo, Casa de mi mamá"
      >
        <Input id="label" placeholder="Casa" {...form.register("label")} />
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          label="Calle"
          htmlFor="street"
          required
          error={form.formState.errors.street?.message}
          className="col-span-2"
        >
          <Input
            id="street"
            placeholder="Av. San Martín"
            invalid={!!form.formState.errors.street}
            {...form.register("street")}
          />
        </FormField>
        <FormField label="Número" htmlFor="number">
          <Input id="number" placeholder="123" {...form.register("number")} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Piso/Depto" htmlFor="apartment">
          <Input id="apartment" placeholder="3°B" {...form.register("apartment")} />
        </FormField>
        <FormField label="Barrio" htmlFor="neighborhood">
          <Input id="neighborhood" placeholder="Centro" {...form.register("neighborhood")} />
        </FormField>
      </div>

      <FormField
        label="Referencias"
        htmlFor="reference"
        hint="Opcional. Ej: timbre roto, frente al parque"
      >
        <Input id="reference" {...form.register("reference")} />
      </FormField>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          {...form.register("isDefault")}
          className="size-4 rounded text-primary-600 focus:ring-primary-500"
        />
        <span className="text-body-md text-neutral-700">
          Usar como dirección predeterminada
        </span>
      </label>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} fullWidth>
          Cancelar
        </Button>
        <Button type="submit" loading={isPending} fullWidth>
          <Check className="size-4" />
          {isEditing ? "Guardar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}
