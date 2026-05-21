"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { action, authAction } from "./safe-action";
import { loginSchema, otpSchema, registerSchema, signupSchema } from "@/schemas";

/* ============================================
 * RATE LIMITING — simple in-memory
 * Para producción reemplazar con Redis/Upstash
 * ============================================ */

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(): string {
  const headersList = headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Devuelve true si el cliente superó el límite.
 * @param key    identificador único (ej: "login:IP" o "otp:email")
 * @param max    máximo de intentos permitidos
 * @param windowMs  ventana de tiempo en ms
 */
function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= max) return true;

  entry.count++;
  return false;
}

/* ============================================
 * LOGIN con email + contraseña
 * Límite: 5 intentos por IP cada 15 minutos
 * ============================================ */

export const loginAction = action
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp();

    if (isRateLimited(`login:${ip}`, 5, 15 * 60 * 1000)) {
      throw new Error("Demasiados intentos. Esperá 15 minutos e intentá de nuevo.");
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsedInput.email,
      password: parsedInput.password,
    });

    if (error) throw new Error("Email o contraseña incorrectos");
    if (!data.user) throw new Error("No se pudo iniciar sesión");

    // Si el email no está verificado, mandamos OTP
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();

      await supabase.auth.signInWithOtp({
        email: parsedInput.email,
        options: { shouldCreateUser: false },
      });

      return { ok: true, needsVerification: true, email: parsedInput.email };
    }

    revalidatePath("/", "layout");
    return { ok: true, needsVerification: false };
  });

/* ============================================
 * REGISTRO con email + contraseña
 * Límite: 3 registros por IP cada hora
 * ============================================ */

export const registerAction = action
  .schema(registerSchema)
  .action(async ({ parsedInput }) => {
    const ip = getClientIp();

    if (isRateLimited(`register:${ip}`, 3, 60 * 60 * 1000)) {
      throw new Error("Demasiados registros desde tu red. Intentá en una hora.");
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
      options: {
        data: { full_name: parsedInput.fullName },
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new Error("Ya existe una cuenta con ese email. Ingresá con tu contraseña.");
      }
      throw new Error(error.message);
    }

    if (!data.user) throw new Error("No se pudo crear la cuenta");

    // signUp() crea sesión automática cuando "Confirm email" está desactivado
    // en Supabase. La cerramos para forzar verificación por OTP siempre.
    await supabase.auth.signOut();

    return { ok: true, email: parsedInput.email };
  });

/* ============================================
 * VERIFICAR OTP de 6 dígitos
 * Límite: 5 intentos por email cada 30 minutos
 * ============================================ */

export const verifyOtpAction = action
  .schema(otpSchema)
  .action(async ({ parsedInput }) => {
    if (isRateLimited(`otp:${parsedInput.email}`, 5, 30 * 60 * 1000)) {
      throw new Error("Demasiados intentos. Esperá 30 minutos.");
    }

    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email: parsedInput.email,
      token: parsedInput.token,
      type: parsedInput.type,
    });

    if (error) throw new Error("Código incorrecto o vencido");
    if (!data.user) throw new Error("No se pudo verificar");

    revalidatePath("/", "layout");
    return { ok: true };
  });

/* ============================================
 * REENVIAR OTP
 * Límite: 3 reenvíos por email cada 15 minutos
 * ============================================ */

export const resendOtpAction = action
  .schema(otpSchema.pick({ email: true }))
  .action(async ({ parsedInput }) => {
    if (isRateLimited(`resend:${parsedInput.email}`, 3, 15 * 60 * 1000)) {
      throw new Error("Ya enviamos varios códigos. Esperá unos minutos.");
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: parsedInput.email,
      options: { shouldCreateUser: false },
    });

    if (error) throw new Error("No se pudo reenviar el código");

    return { ok: true };
  });

/* ============================================
 * GOOGLE OAUTH
 * ============================================ */

export async function loginWithGoogleAction(): Promise<{ url: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error || !data.url) throw new Error("No se pudo iniciar con Google");

  return { url: data.url };
}

/* ============================================
 * COMPLETAR PERFIL
 * ============================================ */

export const completeProfileAction = action
  .schema(signupSchema)
  .action(async ({ parsedInput }) => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { error } = await (supabase.from("profiles") as any)
      .update({
        full_name: parsedInput.fullName,
        phone: parsedInput.phone || null,
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/", "layout");
    return { ok: true };
  });

/* ============================================
 * LOGOUT
 * ============================================ */

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/* ============================================
 * GET DRIVER STATUS
 * ============================================ */

export const getDriverStatusAction = authAction.action(async ({ ctx }) => {
  const supabase = createClient();

  const { data, error } = await (supabase.from("driver_status") as any)
    .select("is_online")
    .eq("driver_id", ctx.session.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return { isOnline: data?.is_online ?? false };
});