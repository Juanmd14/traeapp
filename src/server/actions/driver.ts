"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DELIVERY_TRANSITIONS: Record<string, string> = {
  assigned: "heading_to_store",
  heading_to_store: "at_store",
  at_store: "heading_to_customer",
  heading_to_customer: "delivered",
};

export const claimOrderAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const driverId = ctx.session.id;

    const { data: order, error } = await (supabaseAdmin.from("orders") as any)
      .select("id, status, driver_id, delivery_lat, delivery_lng, stores(lat, lng)")
      .eq("id", parsedInput.orderId)
      .single();

    if (error || !order) throw new Error("Pedido no encontrado");
    if (order.status !== "ready") throw new Error("El pedido ya no está disponible");
    if (order.driver_id) throw new Error("El pedido ya fue tomado por otro repartidor");

    const { data: driverStatus } = await (supabaseAdmin.from("driver_status") as any)
      .select("active_order_id")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (driverStatus?.active_order_id) {
      throw new Error("Ya tenés un pedido activo");
    }

    const { data: delivery, error: deliveryErr } = await (supabaseAdmin.from("deliveries") as any)
      .insert({
        order_id: order.id,
        driver_id: driverId,
        status: "assigned",
        assigned_at: new Date().toISOString(),
        pickup_lat: order.stores?.lat ?? null,
        pickup_lng: order.stores?.lng ?? null,
        dropoff_lat: order.delivery_lat ?? null,
        dropoff_lng: order.delivery_lng ?? null,
      })
      .select("id")
      .single();

    if (deliveryErr || !delivery) throw new Error("Error al crear el delivery");

    await (supabaseAdmin.from("orders") as any)
      .update({ driver_id: driverId })
      .eq("id", order.id);

    await (supabaseAdmin.from("driver_status") as any)
      .upsert({
        driver_id: driverId,
        is_online: true,
        active_order_id: order.id,
        last_seen_at: new Date().toISOString(),
      });

    revalidatePath("/driver");
    return { ok: true, deliveryId: delivery.id };
  });

export const advanceDeliveryAction = authAction
  .schema(z.object({ deliveryId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { data: delivery, error } = await (supabaseAdmin.from("deliveries") as any)
      .select("id, order_id, driver_id, status")
      .eq("id", parsedInput.deliveryId)
      .single();

    if (error || !delivery) throw new Error("Delivery no encontrado");
    if (delivery.driver_id !== ctx.session.id && ctx.session.role !== "admin") {
      throw new Error("No autorizado");
    }

    const nextStatus = DELIVERY_TRANSITIONS[delivery.status];
    if (!nextStatus) throw new Error("No hay siguiente estado");

    const now = new Date().toISOString();
    const deliveryUpdate: Record<string, unknown> = { status: nextStatus };
    const orderUpdate: Record<string, unknown> = {};

    if (nextStatus === "heading_to_customer") {
      deliveryUpdate.picked_up_at = now;
      orderUpdate.status = "picked_up";
      orderUpdate.picked_up_at = now;
    }

    if (nextStatus === "delivered") {
      deliveryUpdate.delivered_at = now;
      orderUpdate.status = "delivered";
      orderUpdate.delivered_at = now;
    }

    await (supabaseAdmin.from("deliveries") as any)
      .update(deliveryUpdate)
      .eq("id", delivery.id);

    if (Object.keys(orderUpdate).length > 0) {
      await (supabaseAdmin.from("orders") as any)
        .update(orderUpdate)
        .eq("id", delivery.order_id);
    }

    if (nextStatus === "delivered") {
      await (supabaseAdmin.from("driver_status") as any)
        .update({ active_order_id: null })
        .eq("driver_id", ctx.session.id);
    }

    revalidatePath("/driver/activo");
    return { ok: true, newStatus: nextStatus };
  });

export const setDriverOnlineAction = authAction
  .schema(z.object({ isOnline: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    await (supabaseAdmin.from("driver_status") as any)
      .upsert({
        driver_id: ctx.session.id,
        is_online: parsedInput.isOnline,
        last_seen_at: new Date().toISOString(),
      });

    revalidatePath("/driver");
    return { ok: true };
  });

export const pushLocationAction = authAction
  .schema(z.object({
    deliveryId: z.string().uuid(),
    lat: z.number(),
    lng: z.number(),
    speedKmh: z.number().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    await Promise.all([
      (supabaseAdmin.from("delivery_tracking") as any).insert({
        delivery_id: parsedInput.deliveryId,
        lat: parsedInput.lat,
        lng: parsedInput.lng,
        speed_kmh: parsedInput.speedKmh ?? null,
      }),
      (supabaseAdmin.from("driver_status") as any).upsert({
        driver_id: ctx.session.id,
        current_lat: parsedInput.lat,
        current_lng: parsedInput.lng,
        last_seen_at: new Date().toISOString(),
      }),
    ]);

    return { ok: true };
  });
