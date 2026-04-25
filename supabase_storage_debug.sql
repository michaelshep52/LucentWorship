-- Run this in Supabase SQL Editor if media uploads still fail after supabase_setup.sql.
-- It shows whether the media bucket and storage policies were actually installed.

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'media';

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
