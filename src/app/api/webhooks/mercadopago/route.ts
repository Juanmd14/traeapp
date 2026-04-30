import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { getPayment, mapMpStatus } from "@/server/services/mercadopago.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Webhook de Mercado Pago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Flujo:
 *   1. Verifica firma HMAC-SHA256 del header `x-signature`.
 *   2. Si el evento es 'payment', busca el pago real en la API.
 *   3. Aplica via RPC idempotente apply_payment_webhook.
 *   4. Devuelve 200 rápido (MP reintenta si demora >22s).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Mercado Pago manda un GET de prueba al configurar el webhook;
    // y en producción siempre POST.
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id") ?? "";
    const signatureHeader = req.headers.get("x-signature") ?? "";
    const requestId = req.headers.get("x-request-id") ?? "";

    const body = await req.json().catch(() => ({}));
    const eventType = body.type ?? body.action ?? "";

    // Sólo procesamos pagos
    if (!eventType.includes("payment")) {
      return NextResponse.json({ ignored: true });
    }

    const paymentId = body.data?.id ?? dataId;
    if (!paymentId) {
      return NextResponse.json({ error: "no payment id" }, { status: 400 });
    }

    // 1. Verificar firma
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret) {
      const parts = Object.fromEntries(
        signatureHeader.split(",").map((p) => p.trim().split("=")),
      );
      const ts = parts.ts;
      const v1 = parts.v1;

      if (!ts || !v1) {
        return NextResponse.json({ error: "invalid signature header" }, { status: 401 });
      }

      const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
      const expected = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

      if (expected !== v1) {
        console.error("[mp-webhook] firma inválida", { expected, v1 });
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
      }
    }

    // 2. Recuperar pago real
    const payment = await getPayment(String(paymentId));

    if (!payment.external_reference) {
      console.warn("[mp-webhook] payment sin external_reference", payment.id);
      return NextResponse.json({ ignored: true });
    }

    const orderId = payment.external_reference;
    const status = mapMpStatus(payment.status ?? "pending");

    // 3. Aplicar via RPC idempotente
    const { error } = await supabaseAdmin.rpc("apply_payment_webhook", {
      p_order_id: orderId,
      p_mp_payment_id: String(payment.id),
      p_status: status,
      p_status_detail: payment.status_detail ?? null,
      p_amount: payment.transaction_amount ?? 0,
      p_raw: payment as unknown as Record<string, unknown>,
    });

    if (error) {
      console.error("[mp-webhook] RPC error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: si status='approved' → disparar notificación push al comercio
    // (puede ir en un trigger Postgres o acá mismo)

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp-webhook] unexpected", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// Mercado Pago a veces hace GET para validar el webhook al configurarlo
export async function GET() {
  return NextResponse.json({ ok: true });
}
