"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { loginSchema, otpSchema, type LoginInput, type OtpInput } from "@/schemas";
import {
  loginAction,
  verifyOtpAction,
  resendOtpAction,
  loginWithGoogleAction,
} from "@/server/actions/auth";

const REMEMBERED_EMAIL_KEY = "va_last_email";

type Stage = "login" | "otp";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [stage, setStage] = useState<Stage>("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", token: "" },
  });

  // Recordar email del último login
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) loginForm.setValue("email", saved);
  }, []);

  // Countdown para reenviar código
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const goToOtp = (email: string) => {
    setPendingEmail(email);
    otpForm.setValue("email", email);
    setStage("otp");
    setResendCooldown(60); // 60s antes de poder reenviar
  };

  const onLoginSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data);

      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }

      if (result?.data?.needsVerification) {
        // Guardar email y pedir verificación
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
        goToOtp(data.email);
        return;
      }

      if (result?.data?.ok) {
        // Login exitoso — guardar email para la próxima
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
        router.push(next);
        router.refresh();
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
        router.push(next);
        router.refresh();
      }
    });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || isPending) return;
    setServerError(null);
    startTransition(async () => {
      const result = await resendOtpAction({ email: pendingEmail });
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      setResendCooldown(60);
    });
  };

  const handleGoogle = async () => {
    setServerError(null);
    setIsGooglePending(true);
    try {
      const { url } = await loginWithGoogleAction();
      window.location.href = url;
    } catch {
      setServerError("No se pudo conectar con Google. Intentá de nuevo.");
      setIsGooglePending(false);
    }
  };

  /* ── STAGE: OTP ── */
  if (stage === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
        <button
          type="button"
          onClick={() => { setStage("login"); setServerError(null); }}
          className="flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div>
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Verificá tu email
          </h1>
          <p className="text-body-md text-neutral-500 mt-1">
            Mandamos un código de 6 dígitos a{" "}
            <span className="font-medium text-neutral-900">{pendingEmail}</span>
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
          Verificar y entrar
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

  /* ── STAGE: LOGIN ── */
  return (
    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
      <div>
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Ingresá a tu cuenta
        </h1>
        <p className="text-body-md text-neutral-500 mt-1">
          Usá tu email y contraseña para entrar.
        </p>
      </div>

      <FormField
        label="Email"
        htmlFor="email"
        required
        error={loginForm.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="vos@ejemplo.com"
          invalid={!!loginForm.formState.errors.email}
          {...loginForm.register("email")}
        />
      </FormField>

      <FormField
        label="Contraseña"
        htmlFor="password"
        required
        error={loginForm.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={!!loginForm.formState.errors.password}
          {...loginForm.register("password")}
        />
      </FormField>

      {serverError && (
        <p className="text-body-sm text-destructive bg-red-50 px-3 py-2 rounded-md">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        <LogIn className="size-4" />
        Ingresar
      </Button>

      {/* Separador */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
        <span className="text-body-xs text-neutral-400">o continuá con</span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={isGooglePending || isPending}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-body-sm font-medium text-neutral-700 dark:text-neutral-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGooglePending
          ? <span className="size-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          : <GoogleIcon />
        }
        Continuar con Google
      </button>

      <p className="text-body-xs text-neutral-500 text-center">
        Al continuar aceptás los términos y la política de privacidad.
      </p>
    </form>
  );
}