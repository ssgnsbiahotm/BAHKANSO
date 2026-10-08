/*
# Add storage policies for app-assets bucket

## What this does
1. Creates RLS policies on storage.objects for the `app-assets` bucket so authenticated users can upload, read, and delete files (recipe images, logo).
2. Public read access for the bucket so images are viewable without authentication.

## Security
- SELECT (read) is public — anyone can view uploaded images.
- INSERT/UPDATE/DELETE restricted to authenticated users only.
*/

-- Public read access for app-assets bucket
DROP POLICY IF EXISTS "public_read_app_assets" ON storage.objects;
CREATE POLICY "public_read_app_assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'app-assets');

-- Authenticated can upload to app-assets
DROP POLICY IF EXISTS "auth_insert_app_assets" ON storage.objects;
CREATE POLICY "auth_insert_app_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-assets');

-- Authenticated can update files in app-assets
DROP POLICY IF EXISTS "auth_update_app_assets" ON storage.objects;
CREATE POLICY "auth_update_app_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-assets') WITH CHECK (bucket_id = 'app-assets');

-- Authenticated can delete from app-assets
DROP POLICY IF EXISTS "auth_delete_app_assets" ON storage.objects;
CREATE POLICY "auth_delete_app_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-assets');