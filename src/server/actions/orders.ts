"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculatePricing } from "@/server/services/pricing.service";
import { createPreference } from "@/server/services/mercadopago.service";

const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  modifiers: z.array(z.object({
    optionId: z.string().uuid(),
    name: z.string(),
    priceDelta: z.number(),
  })).default([]),
  notes: z.string().max(200).optional(),
});

const createOrderInputSchema = z.object({
  storeId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  // Snapshot por si no hay dirección guardada
  deliveryAddressText: z.string().min(5).max(200),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  paymentMethod: z.enum(["cash", "mercadopago"]),
  customerNotes: z.string().max(280).optional(),
  promoCode: z.string().optional(),
  items: z.array(cartItemInputSchema).min(1, "El carrito está vacío"),
});

/**
 * Crea un pedido con servicio de pricing del lado server.
 * NO se confía en el total del cliente — se recalcula desde productos.
 *
 * Flujo:
 *   1. Valida que store esté activo y acepte el método elegido.
 *   2. Trae los productos reales de la BD (precios actuales).
 *   3. Aplica promo si vino código.
 *   4. Calcula pricing.
 *   5. Inserta order + order_items + payment (pending) en transacción.
 *   6. Si MP, crea preferencia y devuelve init_point.
 *   7. Si efectivo, queda en 'pending' hasta que el comercio acepte.
 */
export const createOrderAction = authAction
  .schema(createOrderInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.id;

    // 1. Validar comercio
    const { data: store, error: storeErr } = await supabaseAdmin
      .from("stores")
      .select("id, name, status, delivery_fee, min_order_amount, accepts_cash, accepts_mp, commission_pct")
      .eq("id", parsedInput.storeId)
      .single();

    if (storeErr || !store) throw new Error("Comercio no encontrado");
    if (store.status !== "active") throw new Error("El comercio no está aceptando pedidos");

    if (parsedInput.paymentMethod === "cash" && !store.accepts_cash) {
      throw new Error("Este comercio no acepta efectivo");
    }
    if (parsedInput.paymentMethod === "mercadopago" && !store.accepts_mp) {
      throw new Error("Este comercio no acepta Mercado Pago");
    }

    // 2. Traer productos (precios actuales del server, no del cliente)
    const productIds = parsedInput.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_active, is_available, store_id")
      .in("id", productIds);

    if (prodErr) throw new Error(prodErr.message);

    // Verificar que todos los productos sean del mismo comercio
    if (!products || products.some((p) => p.store_id !== store.id)) {
      throw new Error("Los productos no pertenecen al comercio seleccionado");
    }

    // Verificar disponibilidad
    const unavailable = products.find((p) => !p.is_active || !p.is_available);
    if (unavailable) {
      throw new Error(`"${unavailable.name}" no está disponible en este momento`);
    }

    // 3. Promo (opcional)
    let promo = null;
    if (parsedInput.promoCode) {
      const { data: p } = await supabaseAdmin
        .from("promotions")
        .select("id, type, value, min_order_amount, is_active, ends_at")
        .eq("code", parsedInput.promoCode.toUpperCase())
        .eq("is_active", true)
        .or(`store_id.is.null,store_id.eq.${store.id}`)
        .maybeSingle();

      if (p && (!p.ends_at || new Date(p.ends_at) > new Date())) {
        promo = {
          id: p.id,
          type: p.type as "percent" | "amount" | "free_delivery" | "bxgy",
          value: p.value ? Number(p.value) : null,
          minOrderAmount: p.min_order_amount ? Number(p.min_order_amount) : null,
        };
      }
    }

    // 4. Calcular pricing con datos reales
    const itemsForPricing = parsedInput.items.map((it) => {
      const product = products.find((p) => p.id === it.productId)!;
      const modifiersTotal = it.modifiers.reduce((acc, m) => acc + m.priceDelta, 0);
      return {
        productId: it.productId,
        unitPrice: Number(product.price),
        quantity: it.quantity,
        modifiersTotal,
      };
    });

    const pricing = calculatePricing({
      items: itemsForPricing,
      storeDeliveryFee: Number(store.delivery_fee),
      storeMinOrderAmount: Number(store.min_order_amount),
      storeCommissionPct: Number(store.commission_pct),
      promo,
    });

    if (pricing.error) throw new Error(pricing.error);

    // 5. Insertar order + items + payment (transacción manual)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: userId,
        store_id: store.id,
        delivery_address_id: parsedInput.addressId ?? null,
        delivery_address_text: parsedInput.deliveryAddressText,
        delivery_lat: parsedInput.deliveryLat ?? null,
        delivery_lng: parsedInput.deliveryLng ?? null,
        subtotal: pricing.subtotal,
        delivery_fee: pricing.deliveryFee,
        discount: pricing.discount,
        total: pricing.total,
        commission_amount: pricing.commissionAmount,
        status: "pending",
        payment_method: parsedInput.paymentMethod,
        payment_status: "pending",
        customer_notes: parsedInput.customerNotes ?? null,
        promotion_id: promo?.id ?? null,
        estimated_ready_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) throw new Error(orderErr?.message ?? "Error creando pedido");

    // Items
    const orderItems = parsedInput.items.map((it) => {
      const product = products.find((p) => p.id === it.productId)!;
      const modifiersTotal = it.modifiers.reduce((acc, m) => acc + m.priceDelta, 0);
      const unitTotal = Number(product.price) + modifiersTotal;
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: it.quantity,
        unit_price: Number(product.price),
        modifiers_json: it.modifiers,
        total: unitTotal * it.quantity,
        notes: it.notes ?? null,
      };
    });

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      // rollback manual
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsErr.message);
    }

    // Crear payment row
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      method: parsedInput.paymentMethod,
      status: "pending",
      amount: pricing.total,
      currency: "ARS",
    });

    // 6. Si MP → crear preferencia
    if (parsedInput.paymentMethod === "mercadopago") {
      try {
        const pref = await createPreference({
          orderId: order.id,
          items: [
            ...orderItems.map((i) => ({
              id: i.product_id,
              title: i.product_name,
              quantity: i.quantity,
              unit_price: Number(i.unit_price) +
                (i.modifiers_json as Array<{ priceDelta: number }>).reduce(
                  (acc, m) => acc + m.priceDelta, 0,
                ),
            })),
            ...(pricing.deliveryFee > 0
              ? [{ id: "delivery", title: "Envío", quantity: 1, unit_price: pricing.deliveryFee }]
              : []),
            ...(pricing.discount > 0
              ? [{ id: "discount", title: "Descuento", quantity: 1, unit_price: -pricing.discount }]
              : []),
          ],
          payerEmail: ctx.session.email ?? undefined,
        });

        await supabaseAdmin
          .from("payments")
          .update({ mp_preference_id: pref.id })
          .eq("order_id", order.id);

        revalidatePath("/pedidos");
        return {
          ok: true,
          orderId: order.id,
          orderNumber: order.order_number,
          checkoutUrl:
            process.env.NODE_ENV === "production" ? pref.initPoint : pref.sandboxInitPoint,
        };
      } catch (err) {
        // Si falla MP, cancelamos el pedido
        await supabaseAdmin
          .from("orders")
          .update({ status: "cancelled", cancelled_by: "system", cancel_reason: "Error al iniciar Mercado Pago" })
          .eq("id", order.id);
        throw new Error("No se pudo iniciar el pago. Intentá con efectivo.");
      }
    }

    // 7. Efectivo: pedido queda 'pending' hasta que el comercio acepte
    revalidatePath("/pedidos");
    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl: null, // no redirige
    };
  });

/**
 * Cancela un pedido (cliente, antes de que el comercio acepte).
 */
export const cancelOrderAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, customer_id")
      .eq("id", parsedInput.orderId)
      .single();

    if (!order) throw new Error("Pedido no encontrado");
    if (order.customer_id !== ctx.session.id && ctx.session.role !== "admin") {
      throw new Error("No autorizado");
    }
    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error("El pedido ya no se puede cancelar");
    }

    await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_by: "customer",
        cancel_reason: "Cancelado por el cliente",
      })
      .eq("id", parsedInput.orderId);

    // TODO: si payment_status='approved' → disparar reembolso MP

    revalidatePath("/pedidos");
    return { ok: true };
  });

/**
 * Acciones del comercio sobre el pedido.
 */
export const acceptOrderAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, store_id, status")
      .eq("id", parsedInput.orderId)
      .single();
    if (!order) throw new Error("Pedido no encontrado");

    // Verificar membresía
    const { data: m } = await supabase
      .from("store_users")
      .select("user_id")
      .eq("store_id", order.store_id)
      .eq("user_id", ctx.session.id)
      .maybeSingle();
    if (!m && ctx.session.role !== "admin") throw new Error("No autorizado");

    if (order.status !== "pending" && order.status !== "confirmed") {
      throw new Error("El pedido ya no puede aceptarse");
    }

    await supabaseAdmin
      .from("orders")
      .update({
        status: "preparing",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", parsedInput.orderId);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

export const markOrderReadyAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, store_id, status")
      .eq("id", parsedInput.orderId)
      .single();
    if (!order) throw new Error("Pedido no encontrado");

    const { data: m } = await supabase
      .from("store_users")
      .select("user_id")
      .eq("store_id", order.store_id)
      .eq("user_id", ctx.session.id)
      .maybeSingle();
    if (!m && ctx.session.role !== "admin") throw new Error("No autorizado");

    if (order.status !== "preparing") {
      throw new Error("El pedido no está en preparación");
    }

    await supabaseAdmin
      .from("orders")
      .update({ status: "ready", ready_at: new Date().toISOString() })
      .eq("id", parsedInput.orderId);

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

export const rejectOrderAction = authAction
  .schema(z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(3).max(200),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, store_id, status, payment_method, payment_status")
      .eq("id", parsedInput.orderId)
      .single();
    if (!order) throw new Error("Pedido no encontrado");

    const { data: m } = await supabase
      .from("store_users")
      .select("user_id")
      .eq("store_id", order.store_id)
      .eq("user_id", ctx.session.id)
      .maybeSingle();
    if (!m && ctx.session.role !== "admin") throw new Error("No autorizado");

    await supabaseAdmin
      .from("orders")
      .update({
        status: "rejected",
        cancelled_by: "store",
        cancel_reason: parsedInput.reason,
      })
      .eq("id", parsedInput.orderId);

    // TODO: reembolso MP si ya estaba aprobado

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });
