"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const markNotificationReadAction = authAction
  .schema(z.object({ notificationId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    await (supabaseAdmin.from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", parsedInput.notificationId)
      .eq("user_id", ctx.session.id);

    revalidatePath("/", "layout");
    return { ok: true };
  });

export const markAllNotificationsReadAction = authAction
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    await (supabaseAdmin.from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", ctx.session.id)
      .is("read_at", null);

    revalidatePath("/", "layout");
    return { ok: true };
  });
