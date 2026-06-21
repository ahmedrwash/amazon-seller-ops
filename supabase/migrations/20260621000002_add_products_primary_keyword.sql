-- Persist the Apify tracking keyword per product (was localStorage-only before,
-- so it was lost on reload / other devices). Applied to ehanopftvshlbanmhrxu 2026-06-21.
alter table public.products add column if not exists primary_keyword text;
