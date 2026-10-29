-- Treat existing, unverified catalog entries as samples until an authenticated
-- importer explicitly supplies verified provenance and is_sample = false.
alter table public.products
  add column if not exists is_sample boolean not null default true;

alter table public.products alter column affiliate_url drop not null;

-- Remove the invalid links created by the original illustrative seed. Never
-- pretend a migration is a price observation by setting last_checked_at = now().
update public.products
set affiliate_url = null, last_checked_at = null, badge = 'Dữ liệu minh họa'
where is_sample = true and affiliate_url like 'https://s.shopee.vn/sub_id=%';

alter table public.products drop constraint if exists products_verified_provenance;
alter table public.products add constraint products_verified_provenance check (
  is_sample = true or (
    source_url is not null
    and source_url ~ '^https://[^[:space:]]+$'
    and affiliate_url is not null
    and affiliate_url ~ '^https://[^[:space:]]+$'
    and last_checked_at is not null
  )
);

create or replace function public.guard_product_observation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_sample = false then
    if new.last_checked_at is null or new.last_checked_at > now() then
      raise exception 'Verified products need an observation timestamp that is not in the future';
    end if;
    if TG_OP = 'UPDATE' and old.is_sample = false
      and old.last_checked_at is not null
      and new.last_checked_at < old.last_checked_at then
      raise exception 'A stale observation cannot overwrite a newer product price';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard_observation on public.products;
create trigger products_guard_observation
before insert or update on public.products
for each row execute function public.guard_product_observation();

-- Browser credentials can read only active, explicitly verified rows. Seed data
-- remains useful for development without being exposed as live store offers.
drop policy if exists "Public can read active products" on public.products;
drop policy if exists "Public can read verified products" on public.products;
create policy "Public can read verified products"
on public.products for select
to anon, authenticated
using (is_active = true and is_sample = false);

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
