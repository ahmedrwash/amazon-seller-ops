-- Operational data is collaborative: editing should be role-based, not tied to
-- who created the row. Fixes editors/collaborators being unable to save weekly
-- data for products they don't own ("new row violates row-level security policy").
-- Applied to project ehanopftvshlbanmhrxu on 2026-06-21.

-- Helper: master-data editors (admin + editor only; collaborators excluded)
create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor') and coalesce(active, true)
  );
$$;

-- product_weekly_data: any operator (admin/editor/collaborator) may create & edit
drop policy if exists "pwd_insert_editor"          on public.product_weekly_data;
drop policy if exists "pwd_update_editor_or_owner" on public.product_weekly_data;
drop policy if exists "pwd_update_editor"          on public.product_weekly_data;

create policy "pwd_insert_editor" on public.product_weekly_data
  for insert with check (public.can_edit());

create policy "pwd_update_editor" on public.product_weekly_data
  for update using (public.can_edit()) with check (public.can_edit());

-- products: admin/editor may create & edit any; collaborators cannot create
-- (role definition); owners can always edit their own. Delete stays admin/creator.
drop policy if exists "products_insert_editor"         on public.products;
drop policy if exists "products_update_owner_or_admin" on public.products;
drop policy if exists "products_update_editor"         on public.products;

create policy "products_insert_editor" on public.products
  for insert with check (public.is_editor());

create policy "products_update_editor" on public.products
  for update using  (public.is_editor() or owner_id = auth.uid() or created_by = auth.uid())
            with check (public.is_editor() or owner_id = auth.uid() or created_by = auth.uid());
