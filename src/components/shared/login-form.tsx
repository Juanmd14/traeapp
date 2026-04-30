"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { loginSchema, otpSchema, type LoginInput, type OtpInput } from "@/schemas";
import { requestOtpAction, verifyOtpAction } from "@/server/actions/auth";

type Stage = "email" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emailForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", token: "" },
  });

  const onEmailSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await requestOtpAction(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      if (result?.data?.ok) {
        setEmail(data.email);
        otpForm.setValue("email", data.email);
        setStage("otp");
      }
    });
  };

  const onOtpSubmit = (data: OtpInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      router.push(next);
      router.refresh();
    });
  };

  if (stage === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Ingresá a tu cuenta
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Te mandamos un código por email para entrar.
          </p>
        </div>

        <FormField
          label="Email"
          htmlFor="email"
          required
          error={emailForm.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="vos@ejemplo.com"
            invalid={!!emailForm.formState.errors.email}
            {...emailForm.register("email")}
          />
        </FormField>

        {serverError && (
          <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">
            {serverError}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          <Mail className="size-4" />
          Mandame el código
        </Button>

        <p className="text-body-xs text-neutral-500 text-center">
          Al continuar aceptás los términos y la política de privacidad.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
      <button
        type="button"
        onClick={() => setStage("email")}
        className="flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 transition"
      >
        <ArrowLeft className="size-4" />
        Cambiar email
      </button>

      <div>
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Revisá tu email
        </h1>
        <p className="text-body-md text-neutral-500 mt-1">
          Mandamos un código de 6 dígitos a <span className="font-medium text-neutral-900">{email}</span>
        </p>
      </div>

      <FormField
        label="Código"
        htmlFor="token"
        required
        error={otpForm.formState.errors.token?.message}
      >
        <Input
          id="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="123456"
          className="text-center text-heading-lg tracking-widest font-medium"
          invalid={!!otpForm.formState.errors.token}
          {...otpForm.register("token")}
        />
      </FormField>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        Confirmar
      </Button>

      <button
        type="button"
        onClick={() => onEmailSubmit({ email })}
        disabled={isPending}
        className="block w-full text-center text-body-sm text-primary-600 hover:text-primary-700 transition disabled:opacity-50"
      >
        Reenviar código
      </button>
    </form>
  );
}
