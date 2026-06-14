"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { authAction } from "./safe-action";
import { productSchema } from "@/schemas";

const createProductInput = productSchema.extend({
  storeId: z.string().uuid(),
});

async function ensureStoreMember(userId: string, storeId: string, role: string) {
  if (role === "admin") return;
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("store_users")
    .select("user_id")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership) throw new Error("No tenés permiso sobre este comercio");
}

export const createProductAction = authAction
  .schema(createProductInput)
  .action(async ({ parsedInput, ctx }) => {
    await ensureStoreMember(ctx.session.id, parsedInput.storeId, ctx.session.role);

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        store_id: parsedInput.storeId,
        product_category_id: parsedInput.productCategoryId ?? null,
        name: parsedInput.name,
        description: parsedInput.description || null,
        price: parsedInput.price,
        compare_at_price: parsedInput.compareAtPrice ?? null,
        is_active: true,
        is_available: parsedInput.isAvailable,
      })
      .select("id, name, price")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    return { ok: true, product: data };
  });

const updateProductInput = createProductInput.extend({
  productId: z.string().uuid(),
});

export const updateProductAction = authAction
  .schema(updateProductInput)
  .action(async ({ parsedInput, ctx }) => {
    await ensureStoreMember(ctx.session.id, parsedInput.storeId, ctx.session.role);

    const { error } = await supabaseAdmin
      .from("products")
      .update({
        name: parsedInput.name,
        description: parsedInput.description || null,
        price: parsedInput.price,
        compare_at_price: parsedInput.compareAtPrice ?? null,
        is_available: parsedInput.isAvailable,
      })
      .eq("id", parsedInput.productId)
      .eq("store_id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

export const toggleProductAvailabilityAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    productId: z.string().uuid(),
    isAvailable: z.boolean(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    await ensureStoreMember(ctx.session.id, parsedInput.storeId, ctx.session.role);

    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_available: parsedInput.isAvailable })
      .eq("id", parsedInput.productId)
      .eq("store_id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    revalidatePath("/s/[storeSlug]", "page");
    return { ok: true };
  });

export const deleteProductAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    productId: z.string().uuid(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    await ensureStoreMember(ctx.session.id, parsedInput.storeId, ctx.session.role);

    // Soft delete
    const { error } = await supabaseAdmin
      .from("products")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", parsedInput.productId)
      .eq("store_id", parsedInput.storeId);

    if (error) throw new Error(error.message);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

const quantityOptionSchema = z.object({
  quantity: z.number().int().positive(),
  price: z.number().int().min(0),
  isDefault: z.boolean(),
  isBestDeal: z.boolean(),
});

export const upsertQuantityOptionsAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    productId: z.string().uuid(),
    hasQuantityOptions: z.boolean(),
    hideManualQuantity: z.boolean(),
    options: z.array(quantityOptionSchema),
  }))
  .action(async ({ parsedInput, ctx }) => {
    await ensureStoreMember(ctx.session.id, parsedInput.storeId, ctx.session.role);

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        has_quantity_options: parsedInput.hasQuantityOptions,
        hide_manual_quantity: parsedInput.hideManualQuantity,
      })
      .eq("id", parsedInput.productId)
      .eq("store_id", parsedInput.storeId);

    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await supabaseAdmin
      .from("product_quantity_options")
      .delete()
      .eq("product_id", parsedInput.productId);

    if (deleteError) throw new Error(deleteError.message);

    if (parsedInput.hasQuantityOptions && parsedInput.options.length > 0) {
      const optionsToInsert = parsedInput.options.map((opt, idx) => ({
        product_id: parsedInput.productId,
        quantity: opt.quantity,
        price: opt.price,
        is_default: opt.isDefault,
        is_best_deal: opt.isBestDeal,
        sort_order: idx,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("product_quantity_options")
        .insert(optionsToInsert);

      if (insertError) throw new Error(insertError.message);
    }

    revalidatePath("/comercio", "layout");
    revalidatePath("/s/[storeSlug]", "page");
    return { ok: true };
  });

const modifierOptionSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  isRemoval: z.boolean(),
});

const customGroupSchema = z.object({
  name: z.string().min(1),
  is_required: z.boolean(),
  max_select: z.number().int().min(1),
  options: z.array(z.object({
    name: z.string().min(1),
    price: z.number().int().min(0),
  })),
});

export const upsertModifiersAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    productId: z.string().uuid(),
    removableIngredients: z.array(z.string()),
    extras: z.array(modifierOptionSchema),
    customGroups: z.array(customGroupSchema).default([]),
  }))
  .action(async ({ parsedInput, ctx }) => {
    await ensureStoreMember(ctx.session.id, parsedInput.storeId, ctx.session.role);

    const { error: deleteError } = await supabaseAdmin
      .from("product_modifiers")
      .delete()
      .eq("product_id", parsedInput.productId);

    if (deleteError) throw new Error(deleteError.message);

    if (parsedInput.removableIngredients.length > 0) {
      const { data: modifier, error: modError } = await supabaseAdmin
        .from("product_modifiers")
        .insert({
          product_id: parsedInput.productId,
          name: "Ingredientes",
          is_required: false,
          min_select: 0,
          max_select: parsedInput.removableIngredients.length,
        })
        .select("id")
        .single();

      if (modError) throw new Error(modError.message);

      if (modifier) {
        const optionsToInsert = parsedInput.removableIngredients.map((name) => ({
          modifier_id: modifier.id,
          name,
          price_delta: 0,
          is_removal: true,
        }));

        const { error: optError } = await supabaseAdmin
          .from("product_modifier_options")
          .insert(optionsToInsert);

        if (optError) throw new Error(optError.message);
      }
    }

    if (parsedInput.extras.length > 0) {
      const { data: modifier, error: modError } = await supabaseAdmin
        .from("product_modifiers")
        .insert({
          product_id: parsedInput.productId,
          name: "Extras",
          is_required: false,
          min_select: 0,
          max_select: parsedInput.extras.length,
        })
        .select("id")
        .single();

      if (modError) throw new Error(modError.message);

      if (modifier) {
        const optionsToInsert = parsedInput.extras.map((extra) => ({
          modifier_id: modifier.id,
          name: extra.name,
          price_delta: extra.price,
          is_removal: false,
        }));

        const { error: optError } = await supabaseAdmin
          .from("product_modifier_options")
          .insert(optionsToInsert);

        if (optError) throw new Error(optError.message);
      }
    }

    for (const group of parsedInput.customGroups) {
      const validOptions = group.options.filter((o) => o.name.trim());
      if (validOptions.length === 0) continue;

      const { data: modifier, error: modError } = await supabaseAdmin
        .from("product_modifiers")
        .insert({
          product_id: parsedInput.productId,
          name: group.name,
          is_required: group.is_required,
          min_select: group.is_required ? 1 : 0,
          max_select: group.max_select,
        })
        .select("id")
        .single();

      if (modError) throw new Error(modError.message);

      if (modifier) {
        const { error: optError } = await supabaseAdmin
          .from("product_modifier_options")
          .insert(
            validOptions.map((o) => ({
              modifier_id: modifier.id,
              name: o.name,
              price_delta: o.price,
              is_removal: false,
            }))
          );

        if (optError) throw new Error(optError.message);
      }
    }

    revalidatePath("/comercio", "layout");
    revalidatePath("/s/[storeSlug]", "page");
    return { ok: true };
  });
