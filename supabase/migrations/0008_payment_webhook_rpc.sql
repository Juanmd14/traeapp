-- ================================================================
-- 0008 — RPC apply_payment_webhook (idempotente)
-- ================================================================

create or replace function public.apply_payment_webhook(
  p_order_id        uuid,
  p_mp_payment_id   text,
  p_status          public.payment_status,
  p_status_detail   text,
  p_amount          numeric,
  p_raw             jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_approved boolean;
begin
  -- Idempotencia: si ya está aprobado y llega 'approved' otra vez, no hacer nada.
  select payment_status = 'approved'
    into v_already_approved
    from orders
   where id = p_order_id;

  -- Upsert payment usando mp_payment_id como clave de idempotencia
  insert into payments (
    order_id, method, status, amount, mp_payment_id, mp_status, mp_status_detail,
    raw_payload, paid_at
  )
  values (
    p_order_id, 'mercadopago', p_status, p_amount, p_mp_payment_id,
    p_status::text, p_status_detail, p_raw,
    case when p_status = 'approved' then now() else null end
  )
  on conflict (mp_payment_id) do update set
    status            = excluded.status,
    mp_status         = excluded.mp_status,
    mp_status_detail  = excluded.mp_status_detail,
    raw_payload       = excluded.raw_payload,
    paid_at           = case
                          when excluded.status = 'approved' and payments.paid_at is null
                          then now()
                          else payments.paid_at
                        end,
    updated_at        = now();

  -- Actualizar order según status
  if p_status = 'approved' and not coalesce(v_already_approved, false) then
    update orders
       set payment_status = 'approved',
           status = case
                      when status = 'pending' then 'confirmed'
                      else status
                    end,
           confirmed_at = coalesce(confirmed_at, now())
     where id = p_order_id;

    -- Crear delivery row si no existe (queda 'unassigned')
    insert into deliveries (order_id, status)
    values (p_order_id, 'unassigned')
    on conflict (order_id) do nothing;

  elsif p_status = 'rejected' then
    update orders set payment_status = 'rejected' where id = p_order_id;

  elsif p_status = 'refunded' then
    update orders
       set payment_status = 'refunded',
           status = case when status not in ('delivered','completed','cancelled')
                         then 'cancelled' else status end
     where id = p_order_id;

  elsif p_status = 'cancelled' then
    update orders
       set payment_status = 'cancelled',
           status = 'cancelled',
           cancelled_by = coalesce(cancelled_by, 'system')
     where id = p_order_id and status = 'pending';
  end if;
end;
$$;
