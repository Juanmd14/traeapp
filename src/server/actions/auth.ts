"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { action } from "./safe-action";
import { loginSchema, otpSchema, signupSchema } from "@/schemas";

export const requestOtpAction = action
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedInput.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) throw new Error(error.message);

    return { ok: true, email: parsedInput.email };
  });

export const verifyOtpAction = action
  .schema(otpSchema)
  .action(async ({ parsedInput }) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsedInput.email,
      token: parsedInput.token,
      type: "email",
    });

    if (error) throw new Error("Código incorrecto o vencido");
    if (!data.user) throw new Error("No se pudo iniciar sesión");

    revalidatePath("/", "layout");
    return { ok: true };
  });

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

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}