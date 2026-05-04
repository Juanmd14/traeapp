"use server";

import { z } from "zod";
import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const submitReviewSchema = z.object({
  orderId: z.string().uuid(),
  storeId: z.string().uuid(),
  storeRating: z.number().int().min(1).max(5),
  deliveryRating: z.number().int().min(1).max(5).nullable(),
  comment: z.string().max(500).optional(),
});

export const submitReviewAction = authAction
  .schema(submitReviewSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data: order } = await (supabaseAdmin.from("orders") as any)
      .select("id, customer_id, status")
      .eq("id", parsedInput.orderId)
      .single();

    if (!order) throw new Error("Pedido no encontrado");
    if (order.customer_id !== ctx.session.id) throw new Error("No autorizado");
    if (order.status !== "delivered") throw new Error("El pedido aún no fue entregado");

    const { error } = await (supabaseAdmin.from("reviews") as any).insert({
      order_id: parsedInput.orderId,
      customer_id: ctx.session.id,
      store_id: parsedInput.storeId,
      store_rating: parsedInput.storeRating,
      delivery_rating: parsedInput.deliveryRating,
      comment: parsedInput.comment ?? null,
    });

    if (error) {
      if (error.code === "23505") throw new Error("Ya calificaste este pedido");
      throw new Error(error.message);
    }

    revalidatePath(`/pedido/${parsedInput.orderId}`);
    return { ok: true };
  });
