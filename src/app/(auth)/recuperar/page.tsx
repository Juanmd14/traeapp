"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { resetPasswordRequestSchema, type ResetPasswordRequestInput } from "@/schemas";
import { resetPasswordRequestAction } from "@/server/actions/auth";

export default function RecuperarPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ResetPasswordRequestInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPasswordRequestAction(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
            <Mail className="size-7 text-primary-500" />
          </div>
        </div>
        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Revisá tu email
          </h1>
          <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-2">
            Te mandamos un link para restablecer tu contraseña. Puede tardar unos minutos.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-body-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 transition"
        >
          <ArrowLeft className="size-4" />
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Link
        href="/login"
        className="flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Recuperar contraseña
        </h1>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-1">
          Ingresá tu email y te mandamos un link para crear una nueva.
        </p>
      </div>

      <FormField
        label="Email"
        htmlFor="email"
        required
        error={form.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="vos@ejemplo.com"
          invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
      </FormField>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        Enviar link de recuperación
      </Button>
    </form>
  );
}
