-- ================================================================
-- 0014 — Notificaciones por WhatsApp para dueños de comercios
-- ================================================================
-- El dueño puede vincular su número y recibir un WhatsApp cada vez
-- que entra un pedido nuevo, sin necesidad de tener el panel abierto.
--
-- Implementación demo: CallMeBot (apikey per-store). La columna
-- whatsapp_provider_key queda lista para alojar la apikey de
-- cualquier proveedor (CallMeBot, Twilio, WhatsApp Cloud API).
-- ================================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_provider_key text;

-- Formato E.164 (+5491122223333). Permitimos null para tiendas que no lo configuraron.
ALTER TABLE public.stores
  ADD CONSTRAINT stores_whatsapp_number_format
  CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\+[1-9][0-9]{7,14}$');
