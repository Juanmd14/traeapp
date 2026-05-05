"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

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
    revalidatePath("/", "layout");
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

export const addDriverAction = adminAction
  .schema(z.object({ email: z.string().email("Email inválido") }))
  .action(async ({ parsedInput }) => {
    const { data: profile } = await (supabaseAdmin.from("profiles") as any)
      .select("id, role")
      .eq("email", parsedInput.email.toLowerCase())
      .maybeSingle();
    if (!profile) throw new Error("No existe una cuenta con ese email");
    if (profile.role === "delivery_driver") throw new Error("Ese usuario ya es repartidor");

    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({ role: "delivery_driver" })
      .eq("id", profile.id);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/repartidores");
    return { ok: true };
  });

export const removeDriverAction = adminAction
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const { error } = await (supabaseAdmin.from("profiles") as any)
      .update({ role: "customer" })
      .eq("id", parsedInput.userId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/repartidores");
    return { ok: true };
  });

export const adminCreateStoreAction = adminAction
  .schema(z.object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    address: z.string().min(3, "Dirección requerida"),
    description: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    deliveryFee: z.coerce.number().min(0).default(0),
    minOrderAmount: z.coerce.number().min(0).default(0),
    avgPrepMinutes: z.coerce.number().min(5).max(180).default(30),
    acceptsCash: z.boolean().default(true),
    acceptsMp: z.boolean().default(false),
  }))
  .action(async ({ parsedInput }) => {
    const baseSlug = slugify(parsedInput.name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existing } = await (supabaseAdmin.from("stores") as any)
        .select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
      if (counter > 50) throw new Error("No se pudo generar un slug único");
    }

    const { data: store, error } = await (supabaseAdmin.from("stores") as any)
      .insert({
        slug,
        name: parsedInput.name,
        address: parsedInput.address,
        description: parsedInput.description || null,
        phone: parsedInput.phone || null,
        email: parsedInput.email || null,
        status: "active",
        delivery_fee: parsedInput.deliveryFee,
        min_order_amount: parsedInput.minOrderAmount,
        avg_prep_minutes: parsedInput.avgPrepMinutes,
        delivery_radius_km: 5,
        accepts_cash: parsedInput.acceptsCash,
        accepts_mp: parsedInput.acceptsMp,
        commission_pct: 0,
        is_featured: false,
        rating_avg: 0,
        rating_count: 0,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/admin/comercios");
    redirect(`/admin/comercios/${store.id}`);
  });
