"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Ingresá tu nombre").max(80),
  phone: z
    .string()
    .min(8, "Número muy corto")
    .max(20)
    .regex(/^[\d\s\+\-\(\)]+$/, "Formato inválido")
    .optional()
    .or(z.literal("")),
});

export const updateProfileAction = authAction
  .schema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: parsedInput.fullName,
        phone: parsedInput.phone || null,
      })
      .eq("id", ctx.session.id);

    if (error) throw new Error(error.message);

    revalidatePath("/", "layout");
    return { ok: true };
  });

export const uploadAvatarAction = authAction
  .schema(z.object({
    avatarBase64: z.string(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.id;
    const match = parsedInput.avatarBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) throw new Error("Formato de imagen inválido");

    const mimeType = match[1];
    const base64 = match[2];
    const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
    const buffer = Buffer.from(base64, "base64");

    if (buffer.byteLength > 2 * 1024 * 1024) {
      throw new Error("La imagen es muy grande (máx 2MB)");
    }

    const path = `${userId}/avatar.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: publicUrl } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(path);

    const url = `${publicUrl.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);

    if (updateErr) throw new Error(updateErr.message);

    revalidatePath("/", "layout");
    return { ok: true, url };
  });