/**
 * Envío de WhatsApp para notificar al dueño del comercio.
 *
 * Provider actual: CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/).
 * El owner debe enviar "I allow callmebot to send me messages" al +34 644 51 95 23
 * desde su WhatsApp y recibe un apikey personal. Esa apikey se guarda en
 * stores.whatsapp_provider_key.
 *
 * Demo mode: para producción real conviene migrar a WhatsApp Cloud API (Meta) o Twilio.
 * La interfaz es la misma — solo cambia esta función.
 */

export type WhatsappSendInput = {
  to: string; // E.164 sin espacios ni signos: "+5491122223333"
  apiKey: string;
  message: string;
};

export type WhatsappSendResult = {
  ok: boolean;
  error?: string;
};

const CALLMEBOT_ENDPOINT = "https://api.callmebot.com/whatsapp.php";
const TIMEOUT_MS = 5000;

export async function sendWhatsapp(
  input: WhatsappSendInput,
): Promise<WhatsappSendResult> {
  const phone = input.to.replace(/^\+/, "");

  const url =
    `${CALLMEBOT_ENDPOINT}?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(input.message)}` +
    `&apikey=${encodeURIComponent(input.apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const body = await res.text();

    // CallMeBot devuelve 200 con texto "Message queued" o similar incluso si la apikey
    // está mal — por eso chequeamos también el contenido.
    const looksOk = res.ok && /queued|sent|success/i.test(body);

    if (!looksOk) {
      return { ok: false, error: body.slice(0, 200) };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
