"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authAction } from "./safe-action";
import { requireAuth, getUserStores } from "@/server/auth/session";
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

/**
 * Sube logo o cover del comercio a Storage y actualiza la URL en la tabla.
 */
export const uploadStoreImageAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    imageBase64: z.string(),
    type: z.enum(["logo", "cover"]),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { storeId, imageBase64, type } = parsedInput;

    // Verificar membresía
    const supabase = createClient();
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", storeId)
      .eq("user_id", ctx.session.id)
      .eq("is_active", true)
      .single();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No tenés permiso sobre este comercio");
    }

    // Parsear base64
    const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) throw new Error("Formato de imagen inválido");

    const [, mimeType, base64] = match;
    const ext = (mimeType ?? "image/jpeg").split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const buffer = Buffer.from(base64 ?? "", "base64");

    // Validar tamaño (máx 2MB)
    if (buffer.byteLength > 2 * 1024 * 1024) {
      throw new Error("La imagen es muy grande (máx 2MB)");
    }

    // Determinar bucket y campo
    const bucket = type === "logo" ? "store-logos" : "store-covers";
    const fieldName = type === "logo" ? "logo_url" : "cover_url";
    const path = `${storeId}/${type}.${ext}`;

    // Subir a Storage
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    // Obtener URL pública
    const { data: publicUrl } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    const url = `${publicUrl.publicUrl}?t=${Date.now()}`;

    // Actualizar store
    const updateData = type === "logo" 
      ? { logo_url: url } 
      : { cover_url: url };

    const { error: updateErr } = await supabaseAdmin
      .from("stores")
      .update(updateData as any)
      .eq("id", storeId);

    if (updateErr) throw new Error(updateErr.message);

    revalidatePath("/", "layout");
    revalidatePath("/comercio", "layout");
    return { ok: true, url };
  });

/**
 * Obtiene los horarios de un comercio.
 */
export const getStoreHoursAction = authAction
  .schema(z.object({ storeId: z.string().uuid() }))
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

    const { data, error } = await supabase
      .from("store_hours")
      .select("weekday, opens_at, closes_at")
      .eq("store_id", parsedInput.storeId)
      .order("weekday") as { data: { weekday: number; opens_at: string; closes_at: string }[] | null, error: Error | null };

    if (error) throw new Error(error.message);

    // Convertir a formato más útil
    const hoursByDay = Array(7).fill(null).map((_, i) => {
      const day = data?.find((h) => h.weekday === i);
      return day
        ? { isOpen: true, opensAt: day.opens_at.slice(0, 5), closesAt: day.closes_at.slice(0, 5) }
        : { isOpen: false, opensAt: "09:00", closesAt: "22:00" };
    });

    return { ok: true, hours: hoursByDay };
  });

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const updateStoreHoursSchema = z.object({
  storeId: z.string().uuid(),
  hours: z.array(z.object({
    weekday: z.number().min(0).max(6),
    isOpen: z.boolean(),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })),
});

export const updateStoreHoursAction = authAction
  .schema(updateStoreHoursSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { storeId, hours } = parsedInput;

    const supabase = createClient();
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", storeId)
      .eq("user_id", ctx.session.id)
      .eq("is_active", true)
      .single();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No tenés permiso sobre este comercio");
    }

    // Eliminar horarios existentes
    await supabaseAdmin.from("store_hours").delete().eq("store_id", storeId);

    // Insertar nuevos horarios (solo los que están abiertos)
    const toInsert = hours
      .filter((h) => h.isOpen)
      .map((h) => ({
        store_id: storeId,
        weekday: h.weekday,
        opens_at: h.opensAt || "09:00",
        closes_at: h.closesAt || "22:00",
      }));

    if (toInsert.length > 0) {
      const { error } = await supabaseAdmin
        .from("store_hours")
        .insert(toInsert);

      if (error) throw new Error(error.message);
    }

    revalidatePath("/comercio/horarios");
    return { ok: true };
  });

/**
 * Obtiene las promociones de un comercio.
 */
export const getPromotionsAction = authAction
  .schema(z.object({ storeId: z.string().uuid() }))
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

    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("store_id", parsedInput.storeId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { ok: true, promotions: data };
  });

const promoTypeEnum = z.enum(["percent", "amount", "free_delivery"]);

const createPromotionSchema = z.object({
  storeId: z.string().uuid(),
  code: z.string().min(3).max(20).toUpperCase(),
  type: promoTypeEnum,
  value: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export const createPromotionAction = authAction
  .schema(createPromotionSchema)
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

    // Verificar que el código no exista
    const { data: existing } = await supabase
      .from("promotions")
      .select("id")
      .eq("code", parsedInput.code)
      .single();

    if (existing) {
      throw new Error("Ya existe una promoción con este código");
    }

    const { error } = await supabaseAdmin
      .from("promotions")
      .insert({
        store_id: parsedInput.storeId,
        code: parsedInput.code,
        type: parsedInput.type,
        value: parsedInput.value,
        min_order_amount: parsedInput.minOrderAmount,
        max_uses: parsedInput.maxUses,
        starts_at: parsedInput.startsAt || null,
        ends_at: parsedInput.endsAt || null,
        is_active: true,
      });

    if (error) throw new Error(error.message);

    revalidatePath("/comercio/promociones");
    return { ok: true };
  });

export const togglePromotionAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    promotionId: z.string().uuid(),
    active: z.boolean(),
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

    const { error } = await supabaseAdmin
      .from("promotions")
      .update({ is_active: parsedInput.active })
      .eq("id", parsedInput.promotionId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio/promociones");
    return { ok: true };
  });

export const deletePromotionAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    promotionId: z.string().uuid(),
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

    const { error } = await supabaseAdmin
      .from("promotions")
      .delete()
      .eq("id", parsedInput.promotionId)
      .eq("store_id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio/promociones");
    return { ok: true };
  });

/** Guarda en cookie el comercio activo seleccionado por el dueño. */
export async function setActiveStoreAction(formData: FormData) {
  const session = await requireAuth("/login");
  const storeId = formData.get("storeId") as string;
  if (!storeId) throw new Error("storeId requerido");

  const stores = await getUserStores(session.id);
  if (!stores.some((s) => s.storeId === storeId)) {
    throw new Error("No tenés acceso a ese comercio");
  }

  (cookies() as any).set("active_store_id", storeId, {
    path: "/comercio",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/comercio/pedidos");
}
