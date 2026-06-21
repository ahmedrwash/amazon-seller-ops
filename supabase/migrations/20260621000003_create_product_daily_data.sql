-- Per-day Sales & Traffic (Amazon Business Report by date). One row per product per day.
-- Applied to project ehanopftvshlbanmhrxu on 2026-06-21.
create table if not exists public.product_daily_data (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid,
  date date not null,
  ordered_product_sales numeric,
  units_ordered integer,
  total_order_items integer,
  sessions integer,
  page_views integer,
  buy_box_percentage numeric,
  unit_session_percentage numeric,
  units_refunded integer,
  refund_rate numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (product_id, date)
);

create index if not exists product_daily_data_product_date_idx
  on public.product_daily_data (product_id, date);

alter table public.product_daily_data enable row level security;

drop policy if exists "pdd_select_authenticated" on public.product_daily_data;
drop policy if exists "pdd_insert_editor"        on public.product_daily_data;
drop policy if exists "pdd_update_editor"        on public.product_daily_data;
drop policy if exists "pdd_delete_admin_or_owner" on public.product_daily_data;

create policy "pdd_select_authenticated" on public.product_daily_data
  for select using (auth.role() = 'authenticated');
create policy "pdd_insert_editor" on public.product_daily_data
  for insert with check (public.can_edit());
create policy "pdd_update_editor" on public.product_daily_data
  for update using (public.can_edit()) with check (public.can_edit());
create policy "pdd_delete_admin_or_owner" on public.product_daily_data
  for delete using (public.is_admin() or user_id = auth.uid());
