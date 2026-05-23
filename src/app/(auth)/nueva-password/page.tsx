"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { newPasswordSchema, type NewPasswordInput } from "@/schemas";
import { updatePasswordAction } from "@/server/actions/auth";

export default function NuevaPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = (data: NewPasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePasswordAction(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.push("/login");
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Nueva contraseña
        </h1>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-1">
          Elegí una contraseña segura de al menos 6 caracteres.
        </p>
      </div>

      <FormField
        label="Nueva contraseña"
        htmlFor="password"
        required
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="••••••••"
          invalid={!!form.formState.errors.password}
          {...form.register("password")}
        />
      </FormField>

      <FormField
        label="Confirmá la contraseña"
        htmlFor="confirm"
        required
        error={form.formState.errors.confirm?.message}
      >
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={!!form.formState.errors.confirm}
          {...form.register("confirm")}
        />
      </FormField>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        Guardar contraseña
      </Button>
    </form>
  );
}
