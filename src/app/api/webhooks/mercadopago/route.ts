import crypto from "crypto";

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

/**
 * Valida la firma del webhook de Mercado Pago (header `x-signature`).
 * MP firma un manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * con HMAC-SHA256 usando el secret del panel (MP_WEBHOOK_SECRET).
 *
 * Devuelve true (válido) si MP_WEBHOOK_SECRET no está configurado, para no
 * romper el entorno local/sandbox. En producción, configurá el secret y
 * cualquier POST sin firma válida será rechazado.
 */
function verifyMpSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin secret → no validamos (dev/sandbox)

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id") ?? "";
  if (!xSignature) return false;

  // x-signature: "ts=1700000000,v1=abc123..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // data.id alfanumérico va en minúsculas según la doc de MP.
  const id = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(v1, "hex"),
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // El body puede venir vacío (algunas notificaciones mandan todo por query).
    const body = await req.json().catch(() => ({} as any));
    const url = new URL(req.url);
    const qp = url.searchParams;

    // MP notifica con distintos topics al mismo webhook: "payment" y
    // "merchant_order". Solo nos interesa "payment"; el resto se acusa con 200
    // para que MP no reintente (si no, busca un merchant_order como pago → 404).
    const topic =
      qp.get("type") ?? qp.get("topic") ?? body?.type ?? body?.topic ?? null;

    if (topic && topic !== "payment") {
      return NextResponse.json({ ok: true, ignored: topic });
    }

    // El id del pago puede venir por body o por query (data.id / id).
    const paymentId =
      body?.data?.id ??
      qp.get("data.id") ??
      qp.get("id") ??
      body?.resource?.split("/")?.pop();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment id missing" },
        { status: 400 }
      );
    }

    // Validar firma (solo si MP_WEBHOOK_SECRET está configurado).
    if (!verifyMpSignature(req, String(qp.get("data.id") ?? paymentId))) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Resolver el access_token del seller: Trae agrega ?store_id=...
    // al notification_url cuando crea la preference (ver mercadopago.service.ts).
    // Sin store_id no podemos llamar a getPayment con las credenciales correctas.
    const storeId = qp.get("store_id");
    if (!storeId) {
      return NextResponse.json(
        { error: "store_id missing in notification_url" },
        { status: 400 }
      );
    }

    const { data: store } = await (supabaseAdmin.from("stores") as any)
      .select("mp_access_token")
      .eq("id", storeId)
      .single();

    if (!store?.mp_access_token) {
      return NextResponse.json(
        { error: "Store has no MP credentials" },
        { status: 404 }
      );
    }

    // 1. Obtener pago desde MP (con el token del seller)
    const payment = await getPayment(
      String(paymentId),
      store.mp_access_token,
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
    .select("whatsapp_number, whatsapp_notifications_enabled, name")
    .eq("id", order.store_id)
    .single();

  if (!store?.whatsapp_notifications_enabled || !store.whatsapp_number) {
    return;
  }

  const panelUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/comercio/pedidos`;
  await sendWhatsapp({
    to: store.whatsapp_number,
    storeName: store.name,
    orderNumber: order.order_number,
    totalLabel: `${totalStr} · Mercado Pago (pagado)`,
    panelUrl,
  });
}