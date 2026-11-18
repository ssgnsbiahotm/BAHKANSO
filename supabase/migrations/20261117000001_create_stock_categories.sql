-- Bahkanso — Migration : création de la table stock_categories
-- Permet la gestion CRUD des catégories de stock (onglet Catégories de l'inventaire)

create table if not exists stock_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  site_id uuid references sites(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_stock_categories_site on stock_categories(site_id);

alter table stock_categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'stock_categories' and policyname = 'stock_categories_select_authenticated'
  ) then
    create policy stock_categories_select_authenticated
      on stock_categories for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'stock_categories' and policyname = 'stock_categories_insert_authenticated'
  ) then
    create policy stock_categories_insert_authenticated
      on stock_categories for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'stock_categories' and policyname = 'stock_categories_update_authenticated'
  ) then
    create policy stock_categories_update_authenticated
      on stock_categories for update
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'stock_categories' and policyname = 'stock_categories_delete_authenticated'
  ) then
    create policy stock_categories_delete_authenticated
      on stock_categories for delete
      to authenticated
      using (true);
  end if;
end $$;
