-- ================================================================
-- 0007 — Storage buckets
-- ================================================================

-- Buckets públicos para imágenes
insert into storage.buckets (id, name, public)
values
  ('store-logos',   'store-logos',   true),
  ('store-covers',  'store-covers',  true),
  ('product-images','product-images', true),
  ('avatars',       'avatars',        true)
on conflict (id) do nothing;

-- Policies: lectura pública, escritura por miembros del comercio.
create policy "Public read store-logos"
  on storage.objects for select
  using (bucket_id = 'store-logos');

create policy "Public read store-covers"
  on storage.objects for select
  using (bucket_id = 'store-covers');

create policy "Public read product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Subir avatar propio: la primera carpeta debe ser el user id.
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Para imágenes de comercios la primera carpeta es el store_id.
-- Sólo miembros del comercio pueden escribir.
create policy "Store members upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'store-logos'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'store-covers'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members upload products"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members update logos"
  on storage.objects for update
  using (
    bucket_id = 'store-logos'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members update covers"
  on storage.objects for update
  using (
    bucket_id = 'store-covers'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Store members update products"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );
