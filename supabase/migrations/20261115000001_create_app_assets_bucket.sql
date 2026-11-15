/*
# Create app-assets storage bucket

## What this does
1. Creates the `app-assets` storage bucket if it does not exist (idempotent).
2. Sets it as public so uploaded images are viewable without authentication.

## Security
- The bucket itself is public for read access.
- RLS policies on storage.objects (migration 009) handle INSERT/UPDATE/DELETE restrictions.

## Rollback
-- DELETE FROM storage.buckets WHERE name = 'app-assets';
*/

INSERT INTO storage.buckets (id, name, public)
SELECT gen_random_uuid(), 'app-assets', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'app-assets');
