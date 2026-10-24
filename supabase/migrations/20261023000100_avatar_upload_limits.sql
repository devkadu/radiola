-- Prepared after the post-migration audit reported no per-bucket restrictions.
-- Distinct migration version from 20261023_query_indexes_and_rpc_access.sql.
-- Current application uploads a compressed WebP to <user-id>/avatar.webp.
-- Changes upload settings and write policies only; does not delete files.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';

update storage.buckets
set file_size_limit = 1048576,
    allowed_mime_types = array['image/webp']::text[]
where id = 'avatars';

-- One canonical avatar path per account instead of arbitrary files/folders.
alter policy "Usuário faz upload do próprio avatar"
on storage.objects to authenticated
with check (
  bucket_id = 'avatars'
  and name = (select auth.uid())::text || '/avatar.webp'
);

alter policy "Usuário atualiza o próprio avatar"
on storage.objects to authenticated
using (
  bucket_id = 'avatars'
  and name = (select auth.uid())::text || '/avatar.webp'
)
with check (
  bucket_id = 'avatars'
  and name = (select auth.uid())::text || '/avatar.webp'
);

commit;
