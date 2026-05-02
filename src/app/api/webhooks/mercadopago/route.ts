import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPayment } from "@/server/services/mercadopago.service";

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