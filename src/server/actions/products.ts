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
  const supabase = createClient();
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
