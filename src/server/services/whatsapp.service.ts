/**
 * Envío de WhatsApp para notificar al dueño del comercio.
 *
 * Provider: WhatsApp Cloud API (Meta). Trae se registra una sola vez
 * como sender — cada local solo carga su número en /comercio/datos.
 *
 * Setup global (env vars):
 *   META_WHATSAPP_TOKEN          System User Access Token permanente
 *   META_WHATSAPP_PHONE_ID       Phone Number ID del WhatsApp Business
 *   META_WHATSAPP_TEMPLATE_NAME  Nombre del template aprobado (ej: nuevo_pedido)
 *   META_WHATSAPP_TEMPLATE_LANG  Código de idioma del template (ej: es_MX)
 *
 * El template debe tener 4 variables en el body, en este orden:
 *   {{1}} storeName, {{2}} orderNumber, {{3}} totalLabel, {{4}} panelUrl
 *
 * Nota: el template aprobado ya contiene "$" antes de {{3}}, por eso acá
 * se quita un "$" inicial si viniera en totalLabel (para evitar "$$5.500").
 */

export type WhatsappSendInput = {
  to: string;           // E.164 con o sin "+", ej: "+5491122223333"
  storeName: string;
  orderNumber: number | string;
  totalLabel: string;   // "5.500 · Efectivo" — sin "$" inicial (el template ya lo trae)
  panelUrl: string;
};

export type WhatsappSendResult = {
  ok: boolean;
  error?: string;
};

const GRAPH_VERSION = "v21.0";
const TIMEOUT_MS = 5000;

export async function sendWhatsapp(input: WhatsappSendInput): Promise<WhatsappSendResult> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.META_WHATSAPP_TEMPLATE_LANG ?? "es_MX";

  if (!token || !phoneId || !templateName) {
    return { ok: false, error: "WhatsApp no configurado (faltan env vars META_WHATSAPP_*)" };
  }

  const to = input.to.replace(/^\+/, "");
  const totalLabel = input.totalLabel.replace(/^\$/, "");

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: input.storeName },
            { type: "text", text: String(input.orderNumber) },
            { type: "text", text: totalLabel },
            { type: "text", text: input.panelUrl },
          ],
        },
      ],
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Meta ${res.status}: ${text.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
