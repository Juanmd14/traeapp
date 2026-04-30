"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";

const addressSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  street: z.string().min(2, "Calle requerida").max(120),
  number: z.string().max(20).optional().or(z.literal("")),
  apartment: z.string().max(20).optional().or(z.literal("")),
  neighborhood: z.string().max(80).optional().or(z.literal("")),
  reference: z.string().max(200).optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

export const createAddressAction = authAction
  .schema(addressSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Si es default, primero quitar default de las otras
    if (parsedInput.isDefault) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("profile_id", ctx.session.id);
    }

    const { data, error } = await supabaseAdmin
      .from("addresses")
      .insert({
        profile_id: ctx.session.id,
        label: parsedInput.label || null,
        street: parsedInput.street,
        number: parsedInput.number || null,
        apartment: parsedInput.apartment || null,
        neighborhood: parsedInput.neighborhood || null,
        reference: parsedInput.reference || null,
        is_default: parsedInput.isDefault,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/direcciones");
    revalidatePath("/checkout");
    return { ok: true, address: data };
  });

export const updateAddressAction = authAction
  .schema(addressSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.isDefault) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("profile_id", ctx.session.id);
    }

    const { error } = await supabaseAdmin
      .from("addresses")
      .update({
        label: parsedInput.label || null,
        street: parsedInput.street,
        number: parsedInput.number || null,
        apartment: parsedInput.apartment || null,
        neighborhood: parsedInput.neighborhood || null,
        reference: parsedInput.reference || null,
        is_default: parsedInput.isDefault,
      })
      .eq("id", parsedInput.id)
      .eq("profile_id", ctx.session.id);

    if (error) throw new Error(error.message);

    revalidatePath("/direcciones");
    revalidatePath("/checkout");
    return { ok: true };
  });

export const deleteAddressAction = authAction
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await supabaseAdmin
      .from("addresses")
      .delete()
      .eq("id", parsedInput.id)
      .eq("profile_id", ctx.session.id);

    if (error) throw new Error(error.message);

    revalidatePath("/direcciones");
    revalidatePath("/checkout");
    return { ok: true };
  });

export const setDefaultAddressAction = authAction
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // Quitar default de todas
    await supabaseAdmin
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", ctx.session.id);

    // Setear la nueva default
    const { error } = await supabaseAdmin
      .from("addresses")
      .update({ is_default: true })
      .eq("id", parsedInput.id)
      .eq("profile_id", ctx.session.id);

    if (error) throw new Error(error.message);

    revalidatePath("/direcciones");
    revalidatePath("/checkout");
    return { ok: true };
  });
