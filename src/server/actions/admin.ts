"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adminAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const updateUserRoleAction = adminAction
  .schema(z.object({
    userId: z.string().uuid(),
    role: z.enum(["customer", "delivery_driver", "store_owner", "store_staff", "admin"]),
  }))
  .action(async ({ parsedInput }) => {
    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({ role: parsedInput.role })
      .eq("id", parsedInput.userId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  });

export const toggleUserActiveAction = adminAction
  .schema(z.object({
    userId: z.string().uuid(),
    isActive: z.boolean(),
  }))
  .action(async ({ parsedInput }) => {
    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({ is_active: parsedInput.isActive })
      .eq("id", parsedInput.userId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  });

export const updateStoreStatusAction = adminAction
  .schema(z.object({
    storeId: z.string().uuid(),
    status: z.enum(["draft", "pending_review", "active", "paused", "closed"]),
  }))
  .action(async ({ parsedInput }) => {
    const { error } = await (supabaseAdmin.from("stores") as any)
      .update({ status: parsedInput.status })
      .eq("id", parsedInput.storeId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/comercios");
    return { ok: true };
  });

export const addStoreOwnerAction = adminAction
  .schema(z.object({
    storeId: z.string().uuid(),
    email: z.string().email("Email inválido"),
  }))
  .action(async ({ parsedInput }) => {
    const { data: profile } = await (supabaseAdmin.from("profiles") as any)
      .select("id, full_name")
      .eq("email", parsedInput.email.toLowerCase())
      .maybeSingle();
    if (!profile) throw new Error("No existe una cuenta con ese email");

    const { data: existing } = await (supabaseAdmin.from("store_users") as any)
      .select("user_id")
      .eq("store_id", parsedInput.storeId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (existing) throw new Error("Ese usuario ya está asignado a este comercio");

    const { error } = await (supabaseAdmin.from("store_users") as any)
      .insert({ store_id: parsedInput.storeId, user_id: profile.id, role: "owner", is_active: true });
    if (error) throw new Error(error.message);

    await (supabaseAdmin.from("profiles") as any)
      .update({ role: "store_owner" })
      .eq("id", profile.id);

    revalidatePath(`/admin/comercios/${parsedInput.storeId}`);
    return { ok: true };
  });

export const removeStoreOwnerAction = adminAction
  .schema(z.object({
    storeId: z.string().uuid(),
    userId: z.string().uuid(),
  }))
  .action(async ({ parsedInput }) => {
    const { error } = await (supabaseAdmin.from("store_users") as any)
      .delete()
      .eq("store_id", parsedInput.storeId)
      .eq("user_id", parsedInput.userId);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/comercios/${parsedInput.storeId}`);
    return { ok: true };
  });
