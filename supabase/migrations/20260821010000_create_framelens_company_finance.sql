create table if not exists public.company_finance_transactions (
  id uuid primary key default gen_random_uuid(),
  entry_id text not null unique default ('FIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  occurred_on date not null default current_date,
  direction text not null check (direction in ('income', 'expense')),
  category text not null,
  account_code text,
  counterparty text,
  vendor_payee text,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  payment_method text,
  reference text,
  evidence_reference text,
  duplicate_check text not null default 'not_checked' check (duplicate_check in ('not_checked', 'clear', 'possible_duplicate')),
  status text not null default 'paid' check (status in ('paid', 'pending', 'cancelled')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_finance_accounts (
  account_code text primary key,
  account_name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense', 'control')),
  normal_balance text not null check (normal_balance in ('debit', 'credit', 'n/a')),
  usage_note text,
  active boolean not null default true
);

insert into public.company_finance_accounts (account_code, account_name, account_type, normal_balance, usage_note)
values
  ('1000', 'Cash and cash equivalents', 'asset', 'debit', 'Bank, Wise and payment accounts'),
  ('1400', 'Inventory', 'asset', 'debit', 'LARTIA product procurement until sold'),
  ('4000', 'Revenue', 'income', 'credit', 'Supported operating revenue'),
  ('6100', 'Legal & professional fees', 'expense', 'debit', 'Attorney and professional service fees'),
  ('6110', 'Trademark / IP registration expense', 'expense', 'debit', 'Government filing and registration fees'),
  ('6900', 'Other operating expenses', 'expense', 'debit', 'Other supported operating expenses'),
  ('9990', 'Source / reconciliation clearing', 'control', 'n/a', 'Temporary control only; no balance asserted')
on conflict (account_code) do update set
  account_name = excluded.account_name,
  account_type = excluded.account_type,
  normal_balance = excluded.normal_balance,
  usage_note = excluded.usage_note;

create table if not exists public.company_finance_budgets (
  id uuid primary key default gen_random_uuid(),
  month date not null check (month = date_trunc('month', month)::date),
  category text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month, category, currency)
);

create index if not exists company_finance_transactions_occurred_on_idx
  on public.company_finance_transactions (occurred_on desc);
create index if not exists company_finance_transactions_category_idx
  on public.company_finance_transactions (category);
create index if not exists company_finance_budgets_month_idx
  on public.company_finance_budgets (month desc);

alter table public.company_finance_transactions enable row level security;
alter table public.company_finance_budgets enable row level security;
alter table public.company_finance_accounts enable row level security;

grant select, insert, update, delete on public.company_finance_transactions to authenticated;
grant select, insert, update, delete on public.company_finance_budgets to authenticated;
grant select on public.company_finance_accounts to authenticated;

create policy "finance_users_read_chart_of_accounts"
  on public.company_finance_accounts
  for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and coalesce(p.active, true)
        and coalesce(p.can_manage_finance, false)
    )
  );

create policy "finance_users_manage_company_transactions"
  on public.company_finance_transactions
  for all
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and coalesce(p.active, true)
        and coalesce(p.can_manage_finance, false)
    )
  )
  with check (
    (select auth.uid()) = created_by
    and (
      public.is_admin() or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and coalesce(p.active, true)
          and coalesce(p.can_manage_finance, false)
      )
    )
  );

create policy "finance_users_manage_company_budgets"
  on public.company_finance_budgets
  for all
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and coalesce(p.active, true)
        and coalesce(p.can_manage_finance, false)
    )
  )
  with check (
    (select auth.uid()) = created_by
    and (
      public.is_admin() or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and coalesce(p.active, true)
          and coalesce(p.can_manage_finance, false)
      )
    )
  );

