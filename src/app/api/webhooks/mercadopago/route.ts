import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPayment } from "@/server/services/mercadopago.service";
import { createNotification } from "@/server/services/notifications.service";
import { sendWhatsapp } from "@/server/services/whatsapp.service";

type PaymentWebhookStatus =
  | "pending"
  | "authorized"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Mercado Pago manda distintos formatos según el evento
    const paymentId =
      body?.data?.id ??
      body?.resource?.split("/")?.pop();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment id missing" },
        { status: 400 }
      );
    }

    // 1. Obtener pago desde MP
    const payment = await getPayment(
      String(paymentId)
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // 2. Extraer metadata
    const orderId = payment.metadata?.order_id;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order id missing" },
        { status: 400 }
      );
    }

    const status =
      payment.status as PaymentWebhookStatus;

    // 3. Aplicar webhook via RPC idempotente
    const { error } = await (
      supabaseAdmin as any
    ).rpc("apply_payment_webhook", {
      p_order_id: orderId,
      p_mp_payment_id: String(payment.id),
      p_status: status,
      p_status_detail: payment.status_detail ?? null,
      p_amount: Number(payment.transaction_amount ?? 0),
      p_raw: payment,
    });

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Pago aprobado → notificar al comercio (in-app + WhatsApp si lo activó).
    // Best-effort: si falla cualquier paso, el webhook igual responde ok para
    // que MP no haga retry de una notificación informativa.
    if (status === "approved") {
      notifyStoreOnPaymentApproved(orderId).catch((e) => console.error(e));
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Webhook error",
      },
      {
        status: 500,
      }
    );
  }
}

async function notifyStoreOnPaymentApproved(orderId: string) {
  const { data: order } = await (supabaseAdmin.from("orders") as any)
    .select("id, order_number, total, store_id")
    .eq("id", orderId)
    .single();

  if (!order?.store_id) return;

  const totalStr =
    "$" + Number(order.total).toLocaleString("es-AR", { maximumFractionDigits: 0 });

  const { data: owners } = await (supabaseAdmin.from("store_users") as any)
    .select("user_id")
    .eq("store_id", order.store_id);

  for (const o of (owners as { user_id: string }[] | null) ?? []) {
    createNotification({
      userId: o.user_id,
      title: `Pago confirmado · Pedido #${order.order_number}`,
      body: `${totalStr} · Mercado Pago`,
      data: {
        link: "/comercio/pedidos",
        orderId: order.id,
        orderNumber: order.order_number,
      },
    }).catch(() => {});
  }

  const { data: store } = await (supabaseAdmin.from("stores") as any)
    .select("whatsapp_number, whatsapp_provider_key, whatsapp_notifications_enabled")
    .eq("id", order.store_id)
    .single();

  if (
    !store?.whatsapp_notifications_enabled ||
    !store.whatsapp_number ||
    !store.whatsapp_provider_key
  ) {
    return;
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/comercio/pedidos`;
  await sendWhatsapp({
    to: store.whatsapp_number,
    apiKey: store.whatsapp_provider_key,
    message: `🛎️ Pedido nuevo #${order.order_number}\n${totalStr} · Mercado Pago (pagado)\n${link}`,
  });
}