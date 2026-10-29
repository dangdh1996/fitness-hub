create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  brand text not null,
  category text not null check (category in ('creatine', 'whey')),
  price_vnd integer not null check (price_vnd > 0),
  active_total_g numeric(10, 2) not null check (active_total_g > 0),
  cost_per_active_gram integer generated always as (round(price_vnd / active_total_g)) stored,
  badge text,
  source_url text,
  affiliate_url text not null,
  image_url text,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_cost_idx
  on public.products (category, cost_per_active_gram)
  where is_active = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (is_active = true);

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
