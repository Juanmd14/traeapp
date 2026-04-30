-- ================================================================
-- Asegurar que el bucket 'avatars' tenga las policies correctas.
-- Si ya las tenés desde la migración 0007, esto no hace nada.
-- ================================================================

-- Asegurar bucket público
update storage.buckets set public = true where id = 'avatars';

-- Si las policies no existen, crearlas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read avatars'
  ) then
    create policy "Public read avatars"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users upload own avatar'
  ) then
    create policy "Users upload own avatar"
      on storage.objects for insert
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users update own avatar'
  ) then
    create policy "Users update own avatar"
      on storage.objects for update
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;
end $$;
