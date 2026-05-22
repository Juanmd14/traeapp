"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { registerSchema, otpSchema, type RegisterInput, type OtpInput } from "@/schemas";
import { registerAction, verifyOtpAction, resendOtpAction } from "@/server/actions/auth";

const REMEMBERED_EMAIL_KEY = "va_last_email";

type Stage = "register" | "otp";

export function RegisterForm() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("register");
  const [pendingEmail, setPendingEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", token: "", type: "signup" },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onRegisterSubmit = (data: RegisterInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAction(data);

      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }

      if (result?.data?.ok) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
        setPendingEmail(data.email);
        otpForm.setValue("email", data.email);
        setStage("otp");
        setResendCooldown(60);
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

      if (result?.data?.ok) {
        router.push("/");
        router.refresh();
      }
    });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || isPending) return;
    setServerError(null);
    startTransition(async () => {
      const result = await resendOtpAction({ email: pendingEmail, type: "signup" });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setResendCooldown(60);
    });
  };

  /* ── STAGE: OTP ── */
  if (stage === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
        <button
          type="button"
          onClick={() => { setStage("register"); setServerError(null); }}
          className="flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Verificá tu email
          </h1>
          <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-1">
            Mandamos un código de 6 dígitos a{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{pendingEmail}</span>
          </p>
        </div>

        <FormField
          label="Código de verificación"
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
          <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
            {serverError}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Confirmar y entrar
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isPending}
          className="block w-full text-center text-body-sm text-primary-600 hover:text-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0
            ? `Reenviar código en ${resendCooldown}s`
            : "Reenviar código"}
        </button>
      </form>
    );
  }

  /* ── STAGE: REGISTRO ── */
  return (
    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
      <div>
        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Creá tu cuenta
        </h1>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mt-1">
          Completá tus datos para registrarte.
        </p>
      </div>

      <FormField
        label="Nombre completo"
        htmlFor="fullName"
        required
        error={registerForm.formState.errors.fullName?.message}
      >
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          autoFocus
          placeholder="Nombre y apellido"
          invalid={!!registerForm.formState.errors.fullName}
          {...registerForm.register("fullName")}
        />
      </FormField>

      <FormField
        label="Email"
        htmlFor="email"
        required
        error={registerForm.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          invalid={!!registerForm.formState.errors.email}
          {...registerForm.register("email")}
        />
      </FormField>

      <FormField
        label="Contraseña"
        htmlFor="password"
        required
        error={registerForm.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          invalid={!!registerForm.formState.errors.password}
          {...registerForm.register("password")}
        />
      </FormField>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        <UserPlus className="size-4" />
        Crear cuenta
      </Button>

      <p className="text-body-xs text-neutral-500 dark:text-neutral-400 text-center">
        Al registrarte aceptás los términos y la política de privacidad.
      </p>
    </form>
  );
}