-- ================================================================
-- 0015 — Credenciales Mercado Pago por comercio (Marketplace)
-- ================================================================
-- Cada store guarda su propio access token. La preference se crea
-- con ese token (el dinero acredita directo al seller) y Trae
-- cobra una comisión vía marketplace_fee usando stores.commission_pct.
--
-- Seguridad: el access token NUNCA se expone al cliente. Se revoca
-- SELECT global y se vuelve a otorgar por columna, excluyendo las
-- columnas sensibles. El service_role bypassea grants/RLS, así que
-- los server actions y el webhook MP siguen leyendo el token normal.
-- ================================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS mp_access_token   text,
  ADD COLUMN IF NOT EXISTS mp_webhook_secret text,
  ADD COLUMN IF NOT EXISTS mp_connected_at   timestamptz;

-- Reemplazar SELECT global por SELECT column-level que excluye:
--   mp_access_token, mp_webhook_secret  (credenciales MP)
--   whatsapp_provider_key                (apikey notificaciones)
REVOKE SELECT ON public.stores FROM anon, authenticated;

GRANT SELECT (
  id, slug, name, description, logo_url, cover_url, phone, email, address,
  lat, lng, category_id, status,
  min_order_amount, delivery_fee, avg_prep_minutes, delivery_radius_km,
  accepts_cash, accepts_mp, commission_pct,
  is_featured, rating_avg, rating_count,
  created_at, updated_at, deleted_at,
  whatsapp_number, whatsapp_notifications_enabled,
  mp_connected_at
) ON public.stores TO anon, authenticated;

-- Helper público: "este store tiene MP conectado?" sin filtrar el token.
-- SECURITY DEFINER permite leer la columna restringida.
CREATE OR REPLACE FUNCTION public.store_mp_connected(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT mp_access_token IS NOT NULL AND length(mp_access_token) > 0
     FROM public.stores
     WHERE id = p_store_id),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.store_mp_connected(uuid) TO anon, authenticated;
