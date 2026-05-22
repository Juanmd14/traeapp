"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { storeBasicSchema, type StoreBasicInput } from "@/schemas";
import { createStoreAction } from "@/server/actions/stores";

type Category = {
  id: string;
  name: string;
  emoji: string | null;
};

type Props = {
  categories: Category[];
};

export function OnboardingBasicForm({ categories }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StoreBasicInput>({
    resolver: zodResolver(storeBasicSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = (data: StoreBasicInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createStoreAction(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      if (result?.data?.ok) {
        router.push(`/comercio/onboarding/direccion?storeId=${result.data.storeId}`);
      }
    });
  };

  const selectedCategoryId = form.watch("categoryId");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <FormField
        label="Nombre del comercio"
        htmlFor="name"
        required
        error={form.formState.errors.name?.message}
      >
        <Input
          id="name"
          autoFocus
          placeholder="Ej: Pizzería La Esquina"
          invalid={!!form.formState.errors.name}
          {...form.register("name")}
        />
      </FormField>

      <FormField
        label="Categoría"
        required
        error={form.formState.errors.categoryId?.message}
        hint="Elegí la categoría principal de tu negocio"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  form.setValue("categoryId", cat.id, { shouldValidate: true })
                }
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md border-2 text-body-md transition-all ${
                  isSelected
                    ? "border-accent-500 bg-accent-50 text-accent-800 font-medium ring-2 ring-accent-100"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
                {cat.name}
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField
        label="Descripción"
        htmlFor="description"
        error={form.formState.errors.description?.message}
        hint="Una frase corta sobre tu negocio. Aparece en el marketplace."
      >
        <Input
          id="description"
          placeholder="Pizzas a la piedra desde 1985"
          {...form.register("description")}
        />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField
          label="Teléfono"
          htmlFor="phone"
          required
          error={form.formState.errors.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+54 9 381 555-0101"
            invalid={!!form.formState.errors.phone}
            {...form.register("phone")}
          />
        </FormField>

        <FormField
          label="Email del comercio"
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="contacto@miempresa.com"
            invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
        </FormField>
      </div>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" loading={isPending}>
          Continuar
        </Button>
      </div>
    </form>
  );
}