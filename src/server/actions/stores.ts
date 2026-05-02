"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authAction } from "./safe-action";
import {
  storeBasicSchema,
  storeAddressSchema,
  storeOperationSchema,
  storeProfileSchema,
} from "@/schemas";
import { slugify } from "@/lib/utils";

/**
 * Crea un comercio en estado 'draft' con el usuario actual como owner.
 * Es el paso 1 del onboarding.
 */
export const createStoreAction = authAction
  .schema(storeBasicSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.id;

    // Generar slug único
    const baseSlug = slugify(parsedInput.name);
    let slug = baseSlug;
    let counter = 1;

    // Verificar disponibilidad
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
      if (counter > 50) throw new Error("No se pudo generar un slug único");
    }

    // Insertar comercio (con service_role para evitar RLS en el primer insert)
    const { data: store, error: storeErr } = await supabaseAdmin
      .from("stores")
      .insert({
        slug,
        name: parsedInput.name,
        description: parsedInput.description || null,
        category_id: parsedInput.categoryId,
        phone: parsedInput.phone,
        email: parsedInput.email || null,
        address: "",                       // se completa en paso 2
        status: "draft",
      })
      .select()
      .single();

    if (storeErr) throw new Error(storeErr.message);

    // Asociar al usuario como owner
    const { error: memberErr } = await supabaseAdmin
      .from("store_users")
      .insert({
        store_id: store.id,
        user_id: userId,
        role: "owner",
        is_active: true,
      });

    if (memberErr) {
      // Rollback manual
      await supabaseAdmin.from("stores").delete().eq("id", store.id);
      throw new Error(memberErr.message);
    }

    // Promover al usuario a store_owner si era customer
    if (ctx.session.role === "customer") {
      await supabaseAdmin
        .from("profiles")
        .update({ role: "store_owner" })
        .eq("id", userId);
    }

    revalidatePath("/comercio", "layout");
    return { ok: true, storeId: store.id, slug };
  });

const updateStoreProfileInput = storeProfileSchema.extend({
  storeId: z.string().uuid(),
});

export const updateStoreProfileAction = authAction
  .schema(updateStoreProfileInput)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", parsedInput.storeId)
      .eq("user_id", ctx.session.id)
      .eq("is_active", true)
      .single();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No tenés permiso sobre este comercio");
    }

    const email =
      parsedInput.email === "" ? null : parsedInput.email ?? null;

    const { error } = await supabaseAdmin
      .from("stores")
      .update({
        name: parsedInput.name,
        description: parsedInput.description === "" ? null : parsedInput.description ?? null,
        phone: parsedInput.phone,
        email,
      })
      .eq("id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    revalidatePath("/", "layout");
    return { ok: true };
  });

const updateStoreAddressInput = storeAddressSchema.extend({
  storeId: z.string().uuid(),
});

export const updateStoreAddressAction = authAction
  .schema(updateStoreAddressInput)
  .action(async ({ parsedInput, ctx }) => {
    // Verificar membresía
    const supabase = createClient();
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", parsedInput.storeId)
      .eq("user_id", ctx.session.id)
      .eq("is_active", true)
      .single();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No tenés permiso sobre este comercio");
    }

    const { error } = await supabaseAdmin
      .from("stores")
      .update({
        address: parsedInput.address,
        lat: parsedInput.lat,
        lng: parsedInput.lng,
        delivery_radius_km: parsedInput.deliveryRadiusKm,
      })
      .eq("id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

const updateStoreOperationInput = storeOperationSchema.extend({
  storeId: z.string().uuid(),
});

export const updateStoreOperationAction = authAction
  .schema(updateStoreOperationInput)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", parsedInput.storeId)
      .eq("user_id", ctx.session.id)
      .eq("is_active", true)
      .single();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No tenés permiso sobre este comercio");
    }

    const { error } = await supabaseAdmin
      .from("stores")
      .update({
        min_order_amount: parsedInput.minOrderAmount,
        delivery_fee: parsedInput.deliveryFee,
        avg_prep_minutes: parsedInput.avgPrepMinutes,
        accepts_cash: parsedInput.acceptsCash,
        accepts_mp: parsedInput.acceptsMp,
      })
      .eq("id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

/**
 * Activa el comercio (lo hace visible en el marketplace).
 * Sólo si tiene al menos: nombre, dirección, 1 producto.
 */
export const publishStoreAction = authAction
  .schema(z.object({ storeId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // Verificar que tenga lo mínimo
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, name, address")
      .eq("id", parsedInput.storeId)
      .single();

    if (!store) throw new Error("Comercio no encontrado");
    if (!store.address) throw new Error("Cargá la dirección antes de publicar");

    const { count: productCount } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", parsedInput.storeId)
      .eq("is_active", true);

    if (!productCount || productCount === 0) {
      throw new Error("Cargá al menos un producto antes de publicar");
    }

    const { error } = await supabaseAdmin
      .from("stores")
      .update({ status: "pending_review" })
      .eq("id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

/**
 * Pausa o reactiva la tienda — toggle entre 'active' y 'paused'.
 * Cuando está 'paused', no aparece en el marketplace y no recibe pedidos.
 */
export const toggleStoreStatusAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    pause: z.boolean(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", parsedInput.storeId)
      .eq("user_id", ctx.session.id)
      .eq("is_active", true)
      .single();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No tenés permiso sobre este comercio");
    }

    const newStatus = parsedInput.pause ? "paused" : "active";

    const { error } = await supabaseAdmin
      .from("stores")
      .update({ status: newStatus })
      .eq("id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/", "layout");
    revalidatePath("/comercio", "layout");
    return { ok: true, newStatus };
  });
