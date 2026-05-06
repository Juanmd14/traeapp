"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { authAction } from "./safe-action";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculatePricing } from "@/server/services/pricing.service";
import { createPreference } from "@/server/services/mercadopago.service";
import { createNotification } from "@/server/services/notifications.service";

const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  modifiers: z.array(z.object({
    optionId: z.string().uuid(),
    name: z.string(),
    priceDelta: z.number(),
    isAbsolute: z.boolean().default(false),
  })).default([]),
  notes: z.string().max(200).optional(),
});

const createOrderInputSchema = z.object({
  storeId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  deliveryAddressText: z.string().min(5).max(200),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  paymentMethod: z.enum(["cash", "mercadopago"]),
  customerNotes: z.string().max(280).optional(),
  promoCode: z.string().optional(),
  items: z.array(cartItemInputSchema).min(1, "El carrito está vacío"),
});

export const createOrderAction = authAction
  .schema(createOrderInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.id;

    // 1. Validar comercio
    const { data: store, error: storeErr } = await (supabaseAdmin.from("stores") as any)
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

    // 2. Traer productos
    const productIds = parsedInput.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await (supabaseAdmin.from("products") as any)
      .select("id, name, price, is_active, is_available, store_id")
      .in("id", productIds);

    if (prodErr) throw new Error(prodErr.message);

    if (!products || products.some((p: any) => p.store_id !== store.id)) {
      throw new Error("Los productos no pertenecen al comercio seleccionado");
    }

    const unavailable = products.find((p: any) => !p.is_active || !p.is_available);
    if (unavailable) {
      throw new Error(`"${unavailable.name}" no está disponible en este momento`);
    }

    // 3. Promo (opcional)
    let promo = null;
    if (parsedInput.promoCode) {
      const { data: p } = await (supabaseAdmin.from("promotions") as any)
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

    // 4. Calcular pricing
    const itemsForPricing = parsedInput.items.map((it) => {
      const product = products.find((p: any) => p.id === it.productId)!;
      const absoluteMods = it.modifiers.filter((m) => m.isAbsolute);
      const deltaMods = it.modifiers.filter((m) => !m.isAbsolute);
      const deltaTotal = deltaMods.reduce((acc, m) => acc + m.priceDelta, 0);
      const effectiveUnitPrice = absoluteMods.length > 0
        ? absoluteMods.reduce((acc, m) => acc + m.priceDelta, 0) + deltaTotal
        : Number(product.price) + deltaTotal;
      return {
        productId: it.productId,
        unitPrice: effectiveUnitPrice,
        quantity: it.quantity,
        modifiersTotal: 0,
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

    // 5. Insertar order
    const { data: order, error: orderErr } = await (supabaseAdmin.from("orders") as any)
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
      const product = products.find((p: any) => p.id === it.productId)!;
      const absoluteMods = it.modifiers.filter((m) => m.isAbsolute);
      const deltaMods = it.modifiers.filter((m) => !m.isAbsolute);
      const deltaTotal = deltaMods.reduce((acc, m) => acc + m.priceDelta, 0);
      const effectiveUnitPrice = absoluteMods.length > 0
        ? absoluteMods.reduce((acc, m) => acc + m.priceDelta, 0) + deltaTotal
        : Number(product.price) + deltaTotal;
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: it.quantity,
        unit_price: Number(product.price),
        modifiers_json: it.modifiers,
        total: effectiveUnitPrice * it.quantity,
        notes: it.notes ?? null,
      };
    });

    const { error: itemsErr } = await (supabaseAdmin.from("order_items") as any)
      .insert(orderItems);

    if (itemsErr) {
      await (supabaseAdmin.from("orders") as any).delete().eq("id", order.id);
      throw new Error(itemsErr.message);
    }

    await (supabaseAdmin.from("payments") as any).insert({
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
              unit_price: i.total / i.quantity,
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

        await (supabaseAdmin.from("payments") as any)
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
        await (supabaseAdmin.from("orders") as any)
          .update({ status: "cancelled", cancelled_by: "system", cancel_reason: "Error al iniciar Mercado Pago" })
          .eq("id", order.id);
        throw new Error("No se pudo iniciar el pago. Intentá con efectivo.");
      }
    }

    // 7. Notificar al comercio (best-effort, no bloquea)
    const totalStr = "$" + Number(pricing.total).toLocaleString("es-AR", { maximumFractionDigits: 0 });
    const payLabel = parsedInput.paymentMethod === "cash" ? "Efectivo" : "Mercado Pago";
    ;(supabaseAdmin.from("store_users") as any)
      .select("user_id")
      .eq("store_id", store.id)
      .then(({ data: owners }: { data: { user_id: string }[] | null }) => {
        for (const o of owners ?? []) {
          createNotification({
            userId: o.user_id,
            title: `Nuevo pedido #${order.order_number}`,
            body: `${totalStr} · ${payLabel}`,
            data: { link: "/comercio/pedidos", orderId: order.id, orderNumber: order.order_number },
          }).catch(() => {});
        }
      })
      .catch(() => {});

    // 8. Efectivo
    revalidatePath("/pedidos");
    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl: null,
    };
  });

export const cancelOrderAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = createClient();
    const { data: order } = await (supabase.from("orders") as any)
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

    await (supabaseAdmin.from("orders") as any)
      .update({
        status: "cancelled",
        cancelled_by: "customer",
        cancel_reason: "Cancelado por el cliente",
      })
      .eq("id", parsedInput.orderId);

    revalidatePath("/pedidos");
    return { ok: true };
  });

export const acceptOrderAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { data: order } = await (supabaseAdmin.from("orders") as any)
      .select("id, store_id, status, customer_id, order_number")
      .eq("id", parsedInput.orderId)
      .single();

    if (!order) throw new Error("Pedido no encontrado");

    const supabase = createClient();
    const { data: membership } = await (supabase.from("store_users") as any)
      .select("user_id")
      .eq("store_id", order.store_id)
      .eq("user_id", ctx.session.id)
      .maybeSingle();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No autorizado");
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error("El pedido ya no puede aceptarse");
    }

    const { data: store } = await (supabaseAdmin.from("stores") as any)
      .select("avg_prep_minutes, name")
      .eq("id", order.store_id)
      .single();

    const prepMinutes = store?.avg_prep_minutes ?? 30;
    const estimatedDeliveryAt = new Date(
      Date.now() + (prepMinutes + 30) * 60 * 1000,
    ).toISOString();

    const { error } = await (supabaseAdmin.from("orders") as any)
      .update({
        status: "preparing",
        confirmed_at: new Date().toISOString(),
        estimated_delivery_at: estimatedDeliveryAt,
      })
      .eq("id", parsedInput.orderId);

    if (error) throw new Error(error.message);

    createNotification({
      userId: order.customer_id,
      title: `¡Tu pedido fue confirmado!`,
      body: `${store?.name ?? "El comercio"} está preparando tu pedido #${order.order_number}.`,
      data: { link: `/pedido/${order.id}`, orderId: order.id, orderNumber: order.order_number },
    }).catch(() => {});

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

export const markOrderReadyAction = authAction
  .schema(z.object({ orderId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { data: order } = await (supabaseAdmin.from("orders") as any)
      .select("id, store_id, status, customer_id, order_number")
      .eq("id", parsedInput.orderId)
      .single();

    if (!order) throw new Error("Pedido no encontrado");

    const supabase = createClient();
    const { data: membership } = await (supabase.from("store_users") as any)
      .select("user_id")
      .eq("store_id", order.store_id)
      .eq("user_id", ctx.session.id)
      .maybeSingle();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No autorizado");
    }

    if (order.status !== "preparing") {
      throw new Error("El pedido no está en preparación");
    }

    const { error } = await (supabaseAdmin.from("orders") as any)
      .update({
        status: "ready",
        ready_at: new Date().toISOString(),
      })
      .eq("id", parsedInput.orderId);

    if (error) throw new Error(error.message);

    createNotification({
      userId: order.customer_id,
      title: `Tu pedido está listo 🎉`,
      body: `El pedido #${order.order_number} está en camino hacia vos.`,
      data: { link: `/pedido/${order.id}`, orderId: order.id, orderNumber: order.order_number },
    }).catch(() => {});

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

export const rejectOrderAction = authAction
  .schema(z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(3).max(200),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { data: order } = await (supabaseAdmin.from("orders") as any)
      .select("id, store_id, status, customer_id, order_number, payment_method, payment_status")
      .eq("id", parsedInput.orderId)
      .single();

    if (!order) throw new Error("Pedido no encontrado");

    const supabase = createClient();
    const { data: membership } = await (supabase.from("store_users") as any)
      .select("user_id")
      .eq("store_id", order.store_id)
      .eq("user_id", ctx.session.id)
      .maybeSingle();

    if (!membership && ctx.session.role !== "admin") {
      throw new Error("No autorizado");
    }

    const { error } = await (supabaseAdmin.from("orders") as any)
      .update({
        status: "rejected",
        cancelled_by: "store",
        cancel_reason: parsedInput.reason,
      })
      .eq("id", parsedInput.orderId);

    if (error) throw new Error(error.message);

    createNotification({
      userId: order.customer_id,
      title: `Pedido rechazado`,
      body: parsedInput.reason,
      data: { link: `/pedido/${order.id}`, orderId: order.id, orderNumber: order.order_number },
    }).catch(() => {});

    revalidatePath("/comercio", "layout");
    return { ok: true };
  });

export const validatePromoAction = authAction
  .schema(z.object({
    storeId: z.string().uuid(),
    promoCode: z.string().min(1),
    subtotal: z.number(),
  }))
  .action(async ({ parsedInput }) => {
    const { data: p } = await (supabaseAdmin.from("promotions") as any)
      .select("id, type, value, min_order_amount, ends_at, starts_at, max_uses, uses_count")
      .eq("code", parsedInput.promoCode.toUpperCase())
      .eq("is_active", true)
      .or(`store_id.is.null,store_id.eq.${parsedInput.storeId}`)
      .maybeSingle();

    if (!p) throw new Error("Código inválido o no disponible");
    if (p.ends_at && new Date(p.ends_at) < new Date()) throw new Error("Este código ya expiró");
    if (p.starts_at && new Date(p.starts_at) > new Date()) throw new Error("Este código aún no está activo");
    if (p.max_uses !== null && p.uses_count >= p.max_uses) throw new Error("Este código ya no tiene usos disponibles");
    if (p.min_order_amount && parsedInput.subtotal < Number(p.min_order_amount)) {
      throw new Error("Pedido mínimo para este código: $" + Number(p.min_order_amount));
    }

    let discountAmount = 0;
    const type = p.type as "percent" | "amount" | "free_delivery" | "bxgy";
    if (type === "percent" && p.value) {
      discountAmount = Math.round((parsedInput.subtotal * Number(p.value)) / 100);
    } else if (type === "amount" && p.value) {
      discountAmount = Math.min(Number(p.value), parsedInput.subtotal);
    }

    return {
      ok: true,
      code: parsedInput.promoCode.toUpperCase(),
      type,
      value: p.value ? Number(p.value) : null,
      discountAmount,
    };
  });
