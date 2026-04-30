import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export type MpItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
};

export async function createPreference(params: {
  orderId: string;
  items: MpItem[];
  payerEmail?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const pref = await new Preference(mp).create({
    body: {
      items: params.items.map((i) => ({
        ...i,
        currency_id: "ARS",
      })),
      payer: params.payerEmail ? { email: params.payerEmail } : undefined,
      external_reference: params.orderId,
      back_urls: {
        success: `${appUrl}/pedido/${params.orderId}?status=success`,
        failure: `${appUrl}/pedido/${params.orderId}?status=failure`,
        pending: `${appUrl}/pedido/${params.orderId}?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      metadata: { order_id: params.orderId },
      // Excluir métodos opcionales si querés (ej: ticket en efectivo)
      // payment_methods: { excluded_payment_types: [{ id: 'ticket' }] }
    },
  });

  return {
    id: pref.id!,
    initPoint: pref.init_point!,
    sandboxInitPoint: pref.sandbox_init_point!,
  };
}

export async function getPayment(paymentId: string) {
  return await new Payment(mp).get({ id: paymentId });
}

/**
 * Mapea status de Mercado Pago → nuestro enum payment_status
 */
export function mapMpStatus(
  mpStatus: string,
): "pending" | "authorized" | "approved" | "rejected" | "refunded" | "cancelled" {
  switch (mpStatus) {
    case "approved":
      return "approved";
    case "authorized":
      return "authorized";
    case "in_process":
    case "in_mediation":
    case "pending":
      return "pending";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "cancelled":
      return "cancelled";
    case "rejected":
    default:
      return "rejected";
  }
}
