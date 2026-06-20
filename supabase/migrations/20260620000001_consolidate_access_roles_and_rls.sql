-- ════════════════════════════════════════════════════════════════════════
-- Access consolidation: single source of truth = profiles
-- Vocabulary: admin / editor / collaborator / viewer  (lowercase)
-- Model: role + ownership, with admin override
-- Applied to project ehanopftvshlbanmhrxu on 2026-06-20.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Normalize role values everywhere to the lowercase hierarchy
update public.profiles set role = 'viewer' where role is null;
update public.profiles set role = case lower(role)
  when 'admin'        then 'admin'
  when 'ops'          then 'editor'
  when 'finance'      then 'editor'
  when 'editor'       then 'editor'
  when 'collaborator' then 'collaborator'
  when 'viewer'       then 'viewer'
  else 'viewer' end;

update public.user_accounts set role = case lower(coalesce(role,'viewer'))
  when 'admin'        then 'admin'
  when 'ops'          then 'editor'
  when 'finance'      then 'editor'
  when 'editor'       then 'editor'
  when 'collaborator' then 'collaborator'
  else 'viewer' end;

-- 2. Promote the real owner account
update public.profiles set role = 'admin', active = true
  where lower(email) = 'ahmedrwash@gmail.com';

-- 3. Constrain + default profiles.role to the new vocabulary
alter table public.profiles alter column role set default 'viewer';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','editor','collaborator','viewer'));

-- 4. Authorization helper functions (SECURITY DEFINER -> bypass RLS, no recursion)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and coalesce(active, true)
  );
$$;

create or replace function public.can_edit()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin','editor','collaborator')
      and coalesce(active, true)
  );
$$;

-- 5. profiles RLS -- clean, deduplicated
drop policy if exists "Admins can read all profiles"            on public.profiles;
drop policy if exists "Admins can view all profiles"            on public.profiles;
drop policy if exists "Users can read own profile"              on public.profiles;
drop policy if exists "Users can view own profile"              on public.profiles;
drop policy if exists "Users can insert own profile"            on public.profiles;
drop policy if exists "Admins can update all profiles"          on public.profiles;
drop policy if exists "Users can update own profile"            on public.profiles;
drop policy if exists "Users can update own profile basic info" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Non-admins may edit their own profile but cannot change their own role/active
create policy "profiles_update_own_basic" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role   = (select p.role   from public.profiles p where p.id = auth.uid())
    and active is not distinct from (select p.active from public.profiles p where p.id = auth.uid())
  );

-- 6. products RLS -- read for all authenticated; write by role+ownership(+admin)
drop policy if exists "Marketplace scoped read products"        on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Creators can update own products"        on public.products;
drop policy if exists "Creators can delete own products"        on public.products;

create policy "products_select_authenticated" on public.products
  for select using (auth.role() = 'authenticated');

create policy "products_insert_editor" on public.products
  for insert with check (public.can_edit());

create policy "products_update_owner_or_admin" on public.products
  for update using  (public.is_admin() or created_by = auth.uid() or owner_id = auth.uid())
            with check (public.is_admin() or created_by = auth.uid() or owner_id = auth.uid());

create policy "products_delete_owner_or_admin" on public.products
  for delete using (public.is_admin() or created_by = auth.uid());

-- 7. product_weekly_data RLS -- read for all authenticated; write by editor/owner/admin
drop policy if exists "Users can view product_weekly_data"   on public.product_weekly_data;
drop policy if exists "Users can insert product_weekly_data" on public.product_weekly_data;
drop policy if exists "Users can update product_weekly_data" on public.product_weekly_data;

create policy "pwd_select_authenticated" on public.product_weekly_data
  for select using (auth.role() = 'authenticated');

create policy "pwd_insert_editor" on public.product_weekly_data
  for insert with check (public.can_edit() and user_id = auth.uid());

create policy "pwd_update_editor_or_owner" on public.product_weekly_data
  for update using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (select 1 from public.products p
               where p.id = product_weekly_data.product_id
                 and (p.created_by = auth.uid() or p.owner_id = auth.uid()))
  ) with check (public.can_edit());

create policy "pwd_delete_admin_or_owner" on public.product_weekly_data
  for delete using (public.is_admin() or user_id = auth.uid());

-- 8. user_accounts -> admin-only registry (was wide open to any authenticated user)
drop policy if exists "Admins can insert user_accounts"               on public.user_accounts;
drop policy if exists "Authenticated users can insert user_accounts"  on public.user_accounts;
drop policy if exists "Authenticated users can select user_accounts"  on public.user_accounts;
drop policy if exists "Authenticated users can view user_accounts"    on public.user_accounts;
drop policy if exists "Authenticated users can update user_accounts"  on public.user_accounts;

create policy "user_accounts_admin_all" on public.user_accounts
  for all using (public.is_admin()) with check (public.is_admin());

-- 9. Apply invited role on signup (profiles insert) + link & primary-admin override
create or replace function public.apply_invited_role()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select role, status into inv
    from public.user_accounts where lower(email) = lower(NEW.email) limit 1;
  if found then
    NEW.role   := coalesce(inv.role, NEW.role);
    NEW.active := coalesce(NEW.active, true) and (inv.status is null or inv.status = 'active');
    update public.user_accounts
      set auth_id = NEW.id, updated_at = now()
      where lower(email) = lower(NEW.email);
  end if;
  if lower(NEW.email) = 'ahmedrwash@gmail.com' then
    NEW.role := 'admin';
    NEW.active := true;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_apply_invited_role on public.profiles;
create trigger trg_apply_invited_role
  before insert on public.profiles
  for each row execute function public.apply_invited_role();

-- 10. Close the RLS-disabled snapshot table (advisor flag)
alter table public.amazon_price_tracker enable row level security;
drop policy if exists "amazon_price_tracker_authenticated_all" on public.amazon_price_tracker;
create policy "amazon_price_tracker_authenticated_all" on public.amazon_price_tracker
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
