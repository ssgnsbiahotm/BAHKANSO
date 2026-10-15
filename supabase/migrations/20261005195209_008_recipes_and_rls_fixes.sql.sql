/*
# Create recipes table and fix RLS issues

## 1. New Tables
- `recipes` — Stores farm/agricultural recipes with ingredients, steps, images, and metadata.
  - `id` (uuid PK)
  - `title` (text, not null) — Recipe name
  - `description` (text) — Short description
  - `image_url` (text) — URL to recipe image in Supabase Storage
  - `category` (text) — Recipe category (e.g. "Plat principal", "Accompagnement", "Dessert")
  - `ingredients` (jsonb) — Array of {name, quantity, unit} objects
  - `steps` (jsonb) — Array of step strings
  - `prep_time_minutes` (integer) — Preparation time
  - `cook_time_minutes` (integer) — Cooking time
  - `servings` (integer) — Number of servings
  - `difficulty` (text) — "facile", "moyen", "difficile"
  - `status` (text) — "brouillon", "publiée", "archivée"
  - `author_id` (uuid) — References app_users(id)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

## 2. Security
- Enable RLS on `recipes`.
- Add 4 CRUD policies scoped to `authenticated` role (consistent with existing app auth model).
- Add missing RLS policies to `crops` table (was RLS-enabled with no policies).
- Revoke EXECUTE on `handle_new_user()` from anon and authenticated (security hardening).

## 3. Notes
- The `recipes` table uses the same authenticated-only RLS pattern as all other tables in this project.
- `ingredients` and `steps` are jsonb arrays to allow flexible recipe content.
- `image_url` stores a Supabase Storage public URL when an image is uploaded.
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  category text DEFAULT 'Autre',
  ingredients jsonb DEFAULT '[]'::jsonb,
  steps jsonb DEFAULT '[]'::jsonb,
  prep_time_minutes integer DEFAULT 0,
  cook_time_minutes integer DEFAULT 0,
  servings integer DEFAULT 1,
  difficulty text DEFAULT 'facile',
  status text DEFAULT 'brouillon',
  author_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_recipes" ON recipes;
CREATE POLICY "auth_select_recipes"
ON recipes FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_recipes" ON recipes;
CREATE POLICY "auth_insert_recipes"
ON recipes FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_recipes" ON recipes;
CREATE POLICY "auth_update_recipes"
ON recipes FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_recipes" ON recipes;
CREATE POLICY "auth_delete_recipes"
ON recipes FOR DELETE
TO authenticated
USING (true);

-- Fix: crops table had RLS enabled but no policies
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_crops" ON crops;
CREATE POLICY "auth_select_crops"
ON crops FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_crops" ON crops;
CREATE POLICY "auth_insert_crops"
ON crops FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_crops" ON crops;
CREATE POLICY "auth_update_crops"
ON crops FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_crops" ON crops;
CREATE POLICY "auth_delete_crops"
ON crops FOR DELETE
TO authenticated
USING (true);

-- Fix: Revoke EXECUTE on handle_new_user from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;