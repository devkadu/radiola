-- Run manually in the Supabase SQL Editor. This does not change data or policies.
-- The result contains schema metadata only, never table rows or API keys.
-- Successful anonymous HEAD requests alone cannot establish authenticated RLS.
begin read only;
set local statement_timeout = '15s';

select jsonb_pretty(jsonb_build_object(
  'relations', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', n.nspname,
      'name', c.relname,
      'kind', c.relkind,
      'rls_enabled', c.relrowsecurity,
      'rls_forced', c.relforcerowsecurity,
      'view_security_invoker', coalesce(c.reloptions @> array['security_invoker=true'], false),
      'anon_select', has_table_privilege('anon', c.oid, 'SELECT'),
      'anon_insert', has_table_privilege('anon', c.oid, 'INSERT'),
      'anon_update', has_table_privilege('anon', c.oid, 'UPDATE'),
      'anon_delete', has_table_privilege('anon', c.oid, 'DELETE'),
      'authenticated_select', has_table_privilege('authenticated', c.oid, 'SELECT'),
      'authenticated_insert', has_table_privilege('authenticated', c.oid, 'INSERT'),
      'authenticated_update', has_table_privilege('authenticated', c.oid, 'UPDATE'),
      'authenticated_delete', has_table_privilege('authenticated', c.oid, 'DELETE')
    ) order by n.nspname, c.relname), '[]'::jsonb)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where (n.nspname = 'public' or (n.nspname = 'storage' and c.relname in ('objects', 'buckets')))
      and c.relkind in ('r', 'p', 'v', 'm')
  ),
  'policies', (
    select coalesce(jsonb_agg(to_jsonb(p) order by p.schemaname, p.tablename, p.policyname), '[]'::jsonb)
    from pg_policies p
    where p.schemaname = 'public' or (p.schemaname = 'storage' and p.tablename in ('objects', 'buckets'))
  ),
  'indexes', (
    select coalesce(jsonb_agg(to_jsonb(i) order by i.schemaname, i.tablename, i.indexname), '[]'::jsonb)
    from pg_indexes i
    where i.schemaname = 'public' or (i.schemaname = 'storage' and i.tablename = 'objects')
  ),
  'functions', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef,
      'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
      'service_role_execute', has_function_privilege('service_role', p.oid, 'EXECUTE')
    ) order by p.proname, p.oid), '[]'::jsonb)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
  ),
  'avatar_bucket', (
    select jsonb_build_object('id', b.id, 'public', b.public,
      'file_size_limit', b.file_size_limit, 'allowed_mime_types', b.allowed_mime_types)
    from storage.buckets b where b.id = 'avatars'
  )
)) as security_audit;

rollback;
