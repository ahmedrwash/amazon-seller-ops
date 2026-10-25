-- 1NLT Amazon Ads import design, 2026-10-13.
-- PostgreSQL 15+ / Supabase. ONE-TIME migration; no existing tables are changed.
-- Reviewed design, not applied to production. Worker-only writes; no Amazon mutations.
begin;
create schema amazon_ads;
revoke all on schema amazon_ads from public, anon;

create table amazon_ads.accounts (
  id uuid primary key default gen_random_uuid(),
  legal_entity_ref uuid, -- resolve to public.legal_entities during integration
  seller_account_ref text,
  name text not null,
  external_global_account_id text,
  created_at timestamptz not null default now(),
  unique(external_global_account_id)
);
create table amazon_ads.account_memberships (
  account_id uuid not null references amazon_ads.accounts(id),
  user_id uuid not null references auth.users(id),
  role text not null check(role in ('viewer','editor','admin')),
  primary key(account_id,user_id)
);
create table amazon_ads.country_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references amazon_ads.accounts(id),
  country_code text not null check(country_code ~ '^[A-Z]{2}$'),
  account_type text not null default 'seller' check(account_type in ('seller','vendor','other')),
  external_entity_id text,
  external_profile_id text,
  native_currency text not null check(native_currency ~ '^[A-Z]{3}$'),
  reporting_timezone text, -- IANA timezone from report/account metadata, not browser locale
  unique(account_id,id), unique(account_id,country_code,account_type),
  unique(external_entity_id), unique(external_profile_id)
);
create table amazon_ads.portfolios (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references amazon_ads.accounts(id),
  profile_id uuid not null, external_id text, source_key text not null, name text,
  unique(account_id,id), unique(account_id,profile_id,id), unique(account_id,source_key),
  foreign key(account_id,profile_id) references amazon_ads.country_profiles(account_id,id)
);
create table amazon_ads.campaigns (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references amazon_ads.accounts(id),
  source_key text not null, external_global_id text, name text not null,
  ad_product text not null check(ad_product in ('SP','SB','SD','ST','DSP','OTHER')),
  targeting_mode text, identity_status text not null default 'provisional' check(identity_status in ('verified','provisional','planned')),
  unique(account_id,id), unique(account_id,source_key), unique(account_id,external_global_id),
  check(identity_status <> 'verified' or external_global_id is not null)
);
create table amazon_ads.campaign_countries (
  id uuid primary key default gen_random_uuid(), account_id uuid not null,
  campaign_id uuid not null, profile_id uuid not null, portfolio_id uuid,
  external_country_campaign_id text, state text, delivery_status text,
  daily_budget numeric(20,6) check(daily_budget>=0), budget_currency text check(budget_currency ~ '^[A-Z]{3}$'),
  budget_type text check(budget_type in ('daily','lifetime','other')), bidding_strategy text,
  start_date date, end_date date, observed_at timestamptz,
  unique(account_id,id), unique(account_id,campaign_id,profile_id),
  unique(account_id,profile_id,external_country_campaign_id),
  foreign key(account_id,campaign_id) references amazon_ads.campaigns(account_id,id),
  foreign key(account_id,profile_id) references amazon_ads.country_profiles(account_id,id),
  foreign key(account_id,profile_id,portfolio_id) references amazon_ads.portfolios(account_id,profile_id,id),
  check(end_date is null or start_date is null or end_date>=start_date),
  check(daily_budget is null or budget_currency is not null)
);
create table amazon_ads.ad_groups (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, campaign_country_id uuid not null,
  source_key text not null, external_ad_group_id text, name text not null,
  default_bid numeric(20,6) check(default_bid>=0), currency text check(currency ~ '^[A-Z]{3}$'),
  state text, observed_at timestamptz,
  identity_status text not null default 'provisional' check(identity_status in ('verified','provisional','planned')),
  unique(account_id,id), unique(account_id,campaign_country_id,id), unique(account_id,campaign_country_id,source_key),
  unique(account_id,campaign_country_id,external_ad_group_id),
  foreign key(account_id,campaign_country_id) references amazon_ads.campaign_countries(account_id,id),
  check(identity_status <> 'verified' or external_ad_group_id is not null),
  check(default_bid is null or currency is not null)
);
create table amazon_ads.advertised_products (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, campaign_country_id uuid not null, ad_group_id uuid not null,
  external_ad_id text, source_key text not null, asin text, sku text,
  product_marketplace_ref uuid, -- add FK to existing listing after exact seller/account/country/ASIN/SKU match
  mapping_status text not null default 'unresolved' check(mapping_status in ('unresolved','verified')),
  state text, observed_at timestamptz,
  unique(account_id,id), unique(account_id,campaign_country_id,id), unique(account_id,ad_group_id,source_key),
  foreign key(account_id,campaign_country_id,ad_group_id) references amazon_ads.ad_groups(account_id,campaign_country_id,id),
  check(asin is not null or sku is not null), check(mapping_status<>'verified' or product_marketplace_ref is not null)
);
create table amazon_ads.targets (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, campaign_country_id uuid not null, ad_group_id uuid,
  source_key text not null, external_target_id text,
  target_type text not null check(target_type in ('keyword','product','category','auto','audience','other')),
  expression jsonb not null, target_text text, match_type text,
  bid numeric(20,6) check(bid>=0), currency text check(currency ~ '^[A-Z]{3}$'), state text,
  identity_status text not null default 'provisional' check(identity_status in ('verified','provisional','planned')),
  observed_at timestamptz,
  unique(account_id,id), unique(account_id,campaign_country_id,id), unique(account_id,campaign_country_id,source_key),
  unique(account_id,campaign_country_id,external_target_id),
  foreign key(account_id,campaign_country_id) references amazon_ads.campaign_countries(account_id,id),
  foreign key(account_id,campaign_country_id,ad_group_id) references amazon_ads.ad_groups(account_id,campaign_country_id,id),
  check(identity_status <> 'verified' or (external_target_id is not null and ad_group_id is not null)),
  check(bid is null or currency is not null)
);
create table amazon_ads.negative_targets (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, campaign_country_id uuid not null, ad_group_id uuid,
  source_key text not null, external_negative_id text, scope text not null check(scope in ('campaign','ad_group')),
  target_type text not null check(target_type in ('keyword','product')), expression jsonb not null,
  match_type text, imported_status text, verified_in_console_at timestamptz,
  unique(account_id,id), unique(account_id,campaign_country_id,source_key),
  foreign key(account_id,campaign_country_id) references amazon_ads.campaign_countries(account_id,id),
  foreign key(account_id,campaign_country_id,ad_group_id) references amazon_ads.ad_groups(account_id,campaign_country_id,id),
  check((scope='campaign' and ad_group_id is null) or (scope='ad_group' and ad_group_id is not null))
);
create table amazon_ads.import_batches (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references amazon_ads.accounts(id),
  uploaded_by uuid not null references auth.users(id), original_file_name text not null, storage_object_path text,
  file_sha256 text not null check(file_sha256 ~ '^[0-9a-f]{64}$'),
  logical_dataset_sha256 text not null check(logical_dataset_sha256 ~ '^[0-9a-f]{64}$'),
  source_format text not null check(source_format in ('native_report','bulk_entities','console_export','curated_zip','curated_xlsx')),
  status text not null default 'uploaded' check(status in ('uploaded','staged','validated','approved','applied','rejected')),
  parser_version text not null, source_exported_at timestamptz,
  approved_by uuid references auth.users(id), approved_at timestamptz,
  created_at timestamptz not null default now(), review_notes text,
  unique(account_id,id), unique(account_id,logical_dataset_sha256),
  check(status not in ('approved','applied') or (approved_by is not null and approved_at is not null))
);
create table amazon_ads.import_rows (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, batch_id uuid not null,
  member_name text not null, row_number integer not null check(row_number>=1),
  source_payload jsonb not null, row_sha256 text not null check(row_sha256 ~ '^[0-9a-f]{64}$'),
  normalized_payload jsonb, issues jsonb not null default '[]',
  validation_status text not null default 'pending' check(validation_status in ('pending','accepted','needs_review','rejected')),
  unique(account_id,id), unique(batch_id,member_name,row_number),
  foreign key(account_id,batch_id) references amazon_ads.import_batches(account_id,id)
);
create table amazon_ads.report_versions (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, batch_id uuid not null,
  member_name text not null, report_family text not null,
  source_system text not null check(source_system in ('legacy_reports','unified_reporting','console_export','curated')),
  ad_product text not null check(ad_product in ('SP','SB','SD','ST','DSP','OTHER')),
  report_schema_version text not null, dimension_schema jsonb not null default '[]', metric_schema jsonb not null default '[]',
  granularity text not null check(granularity in ('daily','period','unknown')),
  period_start date, period_end date, source_generated_at timestamptz,
  attribution_window_days integer check(attribution_window_days>=0), attribution_model text,
  reporting_timezone text, scope_filter jsonb not null default '{}', completeness_status text not null default 'unknown'
    check(completeness_status in ('unknown','partial','complete')),
  source_priority integer not null default 0, control_totals jsonb,
  unique(account_id,id), unique(batch_id,member_name,report_family),
  foreign key(account_id,batch_id) references amazon_ads.import_batches(account_id,id),
  check(period_end is null or period_start is null or period_end>=period_start)
);
create table amazon_ads.performance_observations (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, report_version_id uuid not null,
  source_row_id uuid not null, campaign_country_id uuid not null,
  ad_group_id uuid, target_id uuid, advertised_product_id uuid,
  purchased_asin text, search_term text, placement text,
  entity_key text not null, dimension_values jsonb not null default '{}',
  level text not null check(level in ('campaign','ad_group','target','search_term','advertised_product','purchased_product','placement','audience')),
  granularity text not null check(granularity in ('daily','period')),
  period_start date not null, period_end date not null,
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  money_basis text not null check(money_basis in ('native','reported_converted')),
  native_currency text check(native_currency ~ '^[A-Z]{3}$'), source_fx_rate numeric(20,10), fx_source text,
  impressions bigint check(impressions>=0), clicks bigint check(clicks>=0),
  cost numeric(20,6) check(cost>=0), attributed_sales numeric(20,6) check(attributed_sales>=0),
  purchases bigint check(purchases>=0), units bigint check(units>=0),
  tos_share_value numeric(12,6) check(tos_share_value between 0 and 100),
  tos_share_relation text check(tos_share_relation in ('eq','lt','lte','gt','gte')), tos_share_raw text,
  extra_metrics jsonb not null default '{}', reported_rates jsonb not null default '{}',
  validation_status text not null default 'needs_review' check(validation_status in ('needs_review','accepted','rejected')),
  unique(account_id,id), unique(report_version_id,entity_key,period_start,period_end,currency,money_basis),
  foreign key(account_id,report_version_id) references amazon_ads.report_versions(account_id,id),
  foreign key(account_id,source_row_id) references amazon_ads.import_rows(account_id,id),
  foreign key(account_id,campaign_country_id) references amazon_ads.campaign_countries(account_id,id),
  foreign key(account_id,campaign_country_id,ad_group_id) references amazon_ads.ad_groups(account_id,campaign_country_id,id),
  foreign key(account_id,campaign_country_id,target_id) references amazon_ads.targets(account_id,campaign_country_id,id),
  foreign key(account_id,campaign_country_id,advertised_product_id) references amazon_ads.advertised_products(account_id,campaign_country_id,id),
  check(period_end>=period_start), check(granularity<>'daily' or period_start=period_end),
  check(level<>'ad_group' or ad_group_id is not null), check(level not in ('target','search_term') or target_id is not null),
  check(level<>'search_term' or search_term is not null), check(level<>'advertised_product' or advertised_product_id is not null),
  check(level<>'purchased_product' or purchased_asin is not null), check(level<>'placement' or placement is not null),
  check(tos_share_value is null or tos_share_relation is not null),
  check((level in ('target','search_term')) or target_id is null),
  check(level='search_term' or search_term is null), check(level='placement' or placement is null),
  check(money_basis<>'native' or (native_currency is not null and native_currency=currency)),
  check(level<>'campaign' or (entity_key='campaign' and dimension_values='{}'::jsonb))
);
create table amazon_ads.configuration_observations (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, source_row_id uuid not null,
  entity_type text not null, entity_source_key text not null, observed_at timestamptz,
  observed_date date, payload jsonb not null,
  unique(source_row_id,entity_type,entity_source_key),
  foreign key(account_id,source_row_id) references amazon_ads.import_rows(account_id,id)
);
create table amazon_ads.optimization_actions (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, source_row_id uuid,
  campaign_country_id uuid, ad_group_id uuid, target_id uuid,
  action_type text not null, imported_status text, workflow_status text not null default 'proposed'
    check(workflow_status in ('proposed','approved','verified_in_console','rejected')),
  action_date date, old_value jsonb, proposed_value jsonb, reason text,
  verified_by uuid references auth.users(id), verified_at timestamptz,
  foreign key(account_id,source_row_id) references amazon_ads.import_rows(account_id,id),
  foreign key(account_id,campaign_country_id) references amazon_ads.campaign_countries(account_id,id),
  foreign key(account_id,campaign_country_id,ad_group_id) references amazon_ads.ad_groups(account_id,campaign_country_id,id),
  foreign key(account_id,campaign_country_id,target_id) references amazon_ads.targets(account_id,campaign_country_id,id),
  check(workflow_status<>'verified_in_console' or (verified_by is not null and verified_at is not null))
  ,check((ad_group_id is null and target_id is null) or campaign_country_id is not null)
);

-- Ensure lineage and dimension relationships do not only match at account level.
create function amazon_ads.validate_performance_lineage() returns trigger language plpgsql security invoker set search_path='' as $$
declare r amazon_ads.report_versions; s amazon_ads.import_rows;
begin
  select * into strict r from amazon_ads.report_versions where id=new.report_version_id and account_id=new.account_id;
  select * into strict s from amazon_ads.import_rows where id=new.source_row_id and account_id=new.account_id;
  if r.batch_id<>s.batch_id or r.member_name<>s.member_name then raise exception 'Report and source row must share batch/member'; end if;
  if r.granularity<>new.granularity then raise exception 'Report/fact grain mismatch'; end if;
  if r.period_start is null or r.period_end is null or new.period_start<r.period_start or new.period_end>r.period_end then
    raise exception 'Fact requires confirmed report bounds'; end if;
  if new.ad_group_id is not null and new.target_id is not null and not exists (
    select 1 from amazon_ads.targets t where t.id=new.target_id and t.ad_group_id=new.ad_group_id
  ) then raise exception 'Target/ad-group mismatch'; end if;
  if new.ad_group_id is not null and new.advertised_product_id is not null and not exists (
    select 1 from amazon_ads.advertised_products p where p.id=new.advertised_product_id and p.ad_group_id=new.ad_group_id
  ) then raise exception 'Advertised-product/ad-group mismatch'; end if;
  if new.native_currency is not null and not exists (
    select 1 from amazon_ads.campaign_countries c join amazon_ads.country_profiles p on p.id=c.profile_id
    where c.id=new.campaign_country_id and p.native_currency=new.native_currency
  ) then raise exception 'Native currency must match country profile'; end if;
  if new.validation_status='accepted' and new.level in ('target','search_term') and not exists (
    select 1 from amazon_ads.targets t where t.id=new.target_id and t.identity_status='verified'
  ) then raise exception 'Accepted target facts require verified native identity'; end if;
  return new;
end $$;
revoke all on function amazon_ads.validate_performance_lineage() from public,anon,authenticated;
create trigger validate_performance_lineage before insert or update on amazon_ads.performance_observations
for each row execute function amazon_ads.validate_performance_lineage();

create index on amazon_ads.country_profiles(account_id,country_code);
create index on amazon_ads.campaign_countries(account_id,profile_id);
create index on amazon_ads.ad_groups(account_id,campaign_country_id);
create index on amazon_ads.targets(account_id,campaign_country_id,ad_group_id);
create index on amazon_ads.import_rows(account_id,batch_id,validation_status);
create index on amazon_ads.report_versions(account_id,batch_id);
create index on amazon_ads.performance_observations(account_id,campaign_country_id,level,period_start,period_end);
create index on amazon_ads.performance_observations(report_version_id);

-- Membership is server-provisioned. No client role can grant membership or apply imports.
alter table amazon_ads.account_memberships enable row level security;
create policy read_own_membership on amazon_ads.account_memberships for select to authenticated using(user_id=(select auth.uid()));
create function amazon_ads.can_read_account(account uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from amazon_ads.account_memberships m where m.account_id=account and m.user_id=(select auth.uid()));
$$;
revoke all on function amazon_ads.can_read_account(uuid) from public,anon;
grant execute on function amazon_ads.can_read_account(uuid) to authenticated,service_role;
do $$
declare t text;
begin
  foreach t in array array['accounts','country_profiles','portfolios','campaigns','campaign_countries','ad_groups','advertised_products','targets','negative_targets','import_batches','import_rows','report_versions','performance_observations','configuration_observations','optimization_actions'] loop
    execute format('alter table amazon_ads.%I enable row level security',t);
    if t='accounts' then
      execute format('create policy member_read on amazon_ads.%I for select to authenticated using(amazon_ads.can_read_account(id))',t);
    elsif t='import_rows' then
      execute 'create policy editor_read on amazon_ads.import_rows for select to authenticated using(exists(select 1 from amazon_ads.account_memberships m where m.account_id=import_rows.account_id and m.user_id=(select auth.uid()) and m.role in (''editor'',''admin'')))';
    else
      execute format('create policy member_read on amazon_ads.%I for select to authenticated using(amazon_ads.can_read_account(account_id))',t);
    end if;
  end loop;
end $$;
grant usage on schema amazon_ads to authenticated,service_role;
grant select on all tables in schema amazon_ads to authenticated;
grant all on all tables in schema amazon_ads to service_role;
grant usage,select on all sequences in schema amazon_ads to service_role;
-- Data API exposure is an integration step; this SQL does not expose the schema.

-- One observation revision per compatible grain, entity, period, currency and attribution contract.
-- Period facts stay period facts. Search-term and campaign facts are separate measurement bases.
create view amazon_ads.current_performance with (security_invoker=true) as
select distinct on (o.account_id,o.campaign_country_id,o.level,o.granularity,o.period_start,o.period_end,o.entity_key,o.currency,o.money_basis,
 r.attribution_window_days,r.attribution_model,r.reporting_timezone,r.scope_filter,r.ad_product)
 o.*, r.report_family,r.source_system,r.source_generated_at,r.attribution_window_days,r.attribution_model,
 r.completeness_status,r.reporting_timezone,r.scope_filter,r.ad_product,
 case when r.attribution_window_days is null or r.source_generated_at is null or r.reporting_timezone is null then 'unknown'
      when o.period_end + r.attribution_window_days >= coalesce((r.source_generated_at at time zone r.reporting_timezone)::date,current_date) then 'provisional'
      else 'mature_by_window' end as attribution_maturity
from amazon_ads.performance_observations o join amazon_ads.report_versions r on r.id=o.report_version_id
join amazon_ads.import_batches b on b.id=r.batch_id
where o.validation_status='accepted' and b.status='applied'
order by o.account_id,o.campaign_country_id,o.level,o.granularity,o.period_start,o.period_end,o.entity_key,o.currency,o.money_basis,
 r.attribution_window_days,r.attribution_model,r.reporting_timezone,r.scope_filter,r.ad_product, r.source_priority desc,r.source_generated_at desc nulls last,b.created_at desc,r.id desc,o.id desc;

create view amazon_ads.campaign_daily_metrics with (security_invoker=true) as
select account_id,campaign_country_id,period_start as report_date,currency,money_basis,
 attribution_window_days,attribution_model,reporting_timezone,scope_filter,ad_product,
 case when count(cost)=count(*) then sum(cost) end as total_cost,
 case when count(attributed_sales)=count(*) then sum(attributed_sales) end as attributed_sales,
 case when count(impressions)=count(*) then sum(impressions) end as impressions,
 case when count(clicks)=count(*) then sum(clicks) end as clicks,
 case when count(purchases)=count(*) then sum(purchases) end as purchases,
 case when count(cost)=count(*) and count(clicks)=count(*) then sum(cost)/nullif(sum(clicks),0) end as cpc,
 case when count(clicks)=count(*) and count(impressions)=count(*) then 100.0*sum(clicks)/nullif(sum(impressions),0) end as ctr_pct,
 case when count(cost)=count(*) and count(attributed_sales)=count(*) then 100.0*sum(cost)/nullif(sum(attributed_sales),0) end as acos_pct,
 case when count(cost)=count(*) and count(attributed_sales)=count(*) then sum(attributed_sales)/nullif(sum(cost),0) end as roas,
 case when count(purchases)=count(*) and count(clicks)=count(*) then 100.0*sum(purchases)/nullif(sum(clicks),0) end as purchase_conversion_pct
from amazon_ads.current_performance where level='campaign' and granularity='daily'
group by account_id,campaign_country_id,period_start,currency,money_basis,attribution_window_days,attribution_model,reporting_timezone,scope_filter,ad_product;
grant select on amazon_ads.current_performance,amazon_ads.campaign_daily_metrics to authenticated,service_role;
comment on view amazon_ads.campaign_daily_metrics is 'Campaign-native daily facts only. Never add target/search-term/placement views to this total. Unknown is NULL; attribution and currency remain distinct.';
-- App integration for amazon_ads. Included in the generated core migration.
alter table amazon_ads.import_batches add column import_contract jsonb not null default '{}';
alter table amazon_ads.accounts add constraint accounts_legal_entity_ref_fk foreign key(legal_entity_ref) references public.legal_entities(id);
alter table amazon_ads.advertised_products add constraint advertised_listing_ref_fk foreign key(product_marketplace_ref) references public.product_marketplaces(id);
create table amazon_ads.import_events (
 id uuid primary key default gen_random_uuid(),account_id uuid not null references amazon_ads.accounts(id),
 batch_id uuid,actor_id uuid not null references auth.users(id),event_type text not null,
 detail jsonb not null default '{}',created_at timestamptz not null default now(),
 foreign key(account_id,batch_id) references amazon_ads.import_batches(account_id,id)
);
alter table amazon_ads.import_events enable row level security;
create policy member_read on amazon_ads.import_events for select to authenticated using(amazon_ads.can_read_account(account_id));
grant select on amazon_ads.import_events to authenticated;
grant all on amazon_ads.import_events to service_role;
create index on amazon_ads.import_events(account_id,batch_id,created_at);

-- Privileged functions are in an unexposed schema, fixed search path, auth-bound.
create function amazon_ads.app_access(writing boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p left join public.user_module_permissions m on m.user_id=p.id and m.module_id='ops_hub'
 where p.id=auth.uid() and coalesce(p.active,false)
 and coalesce(m.can_view,p.role in ('admin','editor','collaborator','viewer'))
 and (not writing or coalesce(m.can_create,p.role in ('admin','editor'))));
$$;
create function amazon_ads.can_upload(account uuid) returns boolean language sql stable security definer set search_path='' as $$
 select amazon_ads.app_access(true) and exists(select 1 from amazon_ads.account_memberships m where m.account_id=account and m.user_id=auth.uid() and m.role in ('editor','admin'));
$$;
create function amazon_ads.field(payload jsonb,aliases text[]) returns text language sql immutable set search_path='' as $$
 select nullif(btrim(e.value),'') from unnest(aliases) with ordinality a(name,ord)
 join jsonb_each_text(payload) e on regexp_replace(lower(e.key),'[^a-z0-9]','','g')=regexp_replace(lower(a.name),'[^a-z0-9]','','g') order by a.ord limit 1;
$$;
create function amazon_ads.number_value(value text) returns numeric language plpgsql immutable set search_path='' as $$
declare v text;
begin
 if value is null or btrim(value) in ('','—','-') then return null; end if;
 v=regexp_replace(value,'[$,[:space:]]','','g');
 if v !~ '^[0-9]+(\.[0-9]+)?$' then return null; end if;
 return v::numeric;
end $$;
create function amazon_ads.normalize_row(member text,payload jsonb,contract jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare n jsonb; problems jsonb='[]'; day text; rawday text; campaign text; impressions numeric; clicks numeric; cost numeric; sales numeric; purchases numeric; native boolean;
begin
 native=member='native_campaign';
 campaign=amazon_ads.field(payload,array['Campaign ID','campaignId']);
 rawday=amazon_ads.field(payload,array['Date','Day']);day=rawday;
 if day ~ '^\d{2}/\d{2}/\d{4}$' then day=substring(day,7,4)||'-'||substring(day,1,2)||'-'||substring(day,4,2);end if;
 if day !~ '^\d{4}-\d{2}-\d{2}$' then day=null;end if;
 begin perform day::date;exception when others then day=null;end;
 impressions=amazon_ads.number_value(amazon_ads.field(payload,array['Impressions']));
 clicks=amazon_ads.number_value(amazon_ads.field(payload,array['Clicks']));
 cost=amazon_ads.number_value(amazon_ads.field(payload,array['Spend','Cost','Total cost','spend_local','spend_usd']));
 sales=amazon_ads.number_value(amazon_ads.field(payload,array['Sales','7 Day Total Sales','14 Day Total Sales','sales_local','sales_usd']));
 purchases=amazon_ads.number_value(amazon_ads.field(payload,array['Purchases','Orders','7 Day Total Orders (#)','14 Day Total Orders (#)']));
 if not native then problems=problems||'"mapping_review_required"'::jsonb;end if;
 if native and campaign is null then problems=problems||'"missing_native_campaign_id"'::jsonb;end if;
 if native and (day is null or contract->>'granularity'<>'daily') then problems=problems||'"confirmed_daily_date_required"'::jsonb;end if;
 if native and (impressions is null or clicks is null or cost is null or sales is null) then problems=problems||'"missing_or_invalid_base_metrics"'::jsonb;end if;
 if (impressions is not null and impressions<>trunc(impressions)) or (clicks is not null and clicks<>trunc(clicks)) or (purchases is not null and purchases<>trunc(purchases)) then problems=problems||'"count_must_be_integer"'::jsonb;end if;
 -- Each metric contract must match the selected attribution window, including legacy headers.
 if native and ((exists(select 1 from jsonb_object_keys(payload) k where k ~* '^7 Day') and contract->>'attribution_window_days'<>'7') or (exists(select 1 from jsonb_object_keys(payload) k where k ~* '^14 Day') and contract->>'attribution_window_days'<>'14')) then problems=problems||'"attribution_header_mismatch"'::jsonb;end if;
 if native and amazon_ads.field(payload,array['Currency']) is not null and amazon_ads.field(payload,array['Currency'])<>contract->>'currency' then problems=problems||'"row_currency_mismatch"'::jsonb;end if;
 if native and amazon_ads.field(payload,array['Country','Marketplace']) is not null and amazon_ads.field(payload,array['Country','Marketplace'])<>contract->>'country' then problems=problems||'"row_country_mismatch"'::jsonb;end if;
 if member in ('ad_target_snapshots','search_terms') then problems=problems||'"exact_period_bounds_required"'::jsonb;end if;
 if member in ('ad_target_daily','ad_target_snapshots','search_terms','ad_groups') then problems=problems||'"native_ad_group_target_mapping_required"'::jsonb;end if;
 if member='search_terms' and clicks is null then problems=problems||'"missing_clicks_no_CPC_CTR_CVR"'::jsonb;end if;
 if member='ad_target_daily' then problems=problems||'"reported_USD_conversion_not_native_money"'::jsonb;end if;
 if member in ('keyword_plans','negative_keywords','keyword_change_log','native_bulk') then problems=problems||'"configuration_claim_not_executed"'::jsonb;end if;
 n=jsonb_build_object('campaign_id',campaign,'campaign_name',amazon_ads.field(payload,array['Campaign Name','Campaign']),'date',day,
 'impressions',impressions,'clicks',clicks,'cost',cost,'attributed_sales',sales,'purchases',purchases,'units',null,'issues',problems,
 'canonical_publishable',native and jsonb_array_length(problems)=0,'grain',case when member in ('ad_target_snapshots','search_terms') then 'period' when native or member in ('ad_target_daily','ad_daily_summary') then 'daily' else 'configuration' end);
 return n;
end $$;

create function amazon_ads.import_rpc(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); action text=payload->>'action'; account uuid; batch uuid; role_name text; result jsonb;
 b amazon_ads.import_batches; r record; c jsonb; normalized jsonb; content_hash text; row_count integer; existing uuid; profile uuid; campaign uuid; local_campaign uuid; report uuid;
begin
 if actor is null or not amazon_ads.app_access(false) then raise exception 'Advertising access denied' using errcode='42501';end if;
 if action='accounts' then
   select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'role',m.role) order by a.name),'[]') into result from amazon_ads.accounts a join amazon_ads.account_memberships m on m.account_id=a.id where m.user_id=actor;
   return jsonb_build_object('accounts',result,'can_create_account',public.is_admin());
 end if;
 if action='create_account' then
   if not public.is_admin() then raise exception 'Only an application admin can initialize an advertising account' using errcode='42501';end if;
   if length(btrim(coalesce(payload->>'name','')))<3 or length(payload->>'name')>120 then raise exception 'Account name must have 3–120 characters';end if;
   insert into amazon_ads.accounts(name) values(btrim(payload->>'name')) returning id into account;
   insert into amazon_ads.account_memberships values(account,actor,'admin');
   insert into amazon_ads.import_events(account_id,actor_id,event_type) values(account,actor,'account_created');
   return jsonb_build_object('account_id',account);
 end if;
 account=(payload->>'account_id')::uuid;
 select m.role into role_name from amazon_ads.account_memberships m where m.account_id=account and m.user_id=actor;
 if role_name is null then raise exception 'Account membership required' using errcode='42501';end if;
 if action='list' then
   select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into result from (select q.id,q.original_file_name,q.status,q.source_format,q.created_at,q.review_notes,q.import_contract,(select count(*) from amazon_ads.import_rows i where i.batch_id=q.id) row_count,(select count(*) from amazon_ads.import_rows i where i.batch_id=q.id and i.validation_status='needs_review') issue_rows from amazon_ads.import_batches q where q.account_id=account order by q.created_at desc limit 100) x;
   return jsonb_build_object('batches',result,'role',role_name);
 end if;
 if action='metrics' then
   select coalesce(jsonb_agg(x),'[]') into result from (select m.*,c.name as campaign_name,p.country_code,cc.external_country_campaign_id,o.attribution_maturity,rv.batch_id,rv.source_generated_at,rv.completeness_status from amazon_ads.campaign_daily_metrics m join amazon_ads.campaign_countries cc on cc.id=m.campaign_country_id join amazon_ads.campaigns c on c.id=cc.campaign_id join amazon_ads.country_profiles p on p.id=cc.profile_id join amazon_ads.current_performance o on o.account_id=m.account_id and o.campaign_country_id=m.campaign_country_id and o.level='campaign' and o.granularity='daily' and o.period_start=m.report_date and o.currency=m.currency and o.money_basis=m.money_basis and o.attribution_window_days is not distinct from m.attribution_window_days and o.attribution_model is not distinct from m.attribution_model and o.reporting_timezone is not distinct from m.reporting_timezone and o.scope_filter=m.scope_filter and o.ad_product=m.ad_product join amazon_ads.report_versions rv on rv.id=o.report_version_id where m.account_id=account order by report_date desc limit 1000) x;
   return jsonb_build_object('rows',result,'truncated_at',1000);
 end if;
 if action='detail' then
   if role_name not in ('editor','admin') then raise exception 'Source rows require editor access' using errcode='42501';end if;
   batch=(payload->>'batch_id')::uuid;
   select * into strict b from amazon_ads.import_batches where id=batch and account_id=account;
   select coalesce(jsonb_agg(x order by x.member_name,x.row_number),'[]') into result from (select id,member_name,row_number,source_payload,normalized_payload,issues,validation_status from amazon_ads.import_rows where batch_id=batch and account_id=account order by member_name,row_number limit 100 offset greatest(0,least(5000,coalesce((payload->>'offset')::int,0)))) x;
   return jsonb_build_object('batch',to_jsonb(b),'rows',result,'events',(select coalesce(jsonb_agg(e order by created_at desc),'[]') from amazon_ads.import_events e where e.batch_id=batch));
 end if;
 if role_name not in ('editor','admin') or not amazon_ads.app_access(true) then raise exception 'Upload permission required' using errcode='42501';end if;
 if action='stage' then
   if jsonb_typeof(payload->'rows') is distinct from 'array' or pg_column_size(payload)>25000000 then raise exception 'Invalid or oversized upload';end if;
   row_count=jsonb_array_length(payload->'rows');if row_count<1 or row_count>5000 then raise exception 'Upload must contain 1–5,000 rows';end if;
   c=coalesce(payload->'contract','{}');
   -- Hash the original logical rows server-side. Ignore browser-normalized metrics/status/actor IDs.
   select encode(sha256(convert_to(string_agg(member||':'||data::text,E'\n' order by member,num),'UTF8')),'hex') into content_hash from (
     select value->>'member_name' member,(value->>'row_number')::int num,
       (select jsonb_object_agg(key,case when v is null or btrim(v)='' then null else to_jsonb(v) end) from jsonb_each_text(value->'source_payload') e(key,v)) data
     from jsonb_array_elements(payload->'rows')) s;
   perform pg_advisory_xact_lock(hashtextextended(account::text||content_hash,0));
   select id into existing from amazon_ads.import_batches where account_id=account and logical_dataset_sha256=content_hash;
   if existing is not null then return jsonb_build_object('batch_id',existing,'duplicate',true);end if;
   if payload->>'storage_path' is null or split_part(payload->>'storage_path','/',1)<>actor::text or split_part(payload->>'storage_path','/',2)<>account::text or not exists(select 1 from storage.objects o where bucket_id='advertising-imports' and o.name=payload->>'storage_path') then raise exception 'Upload the original file to your private account folder first';end if;
   insert into amazon_ads.import_batches(account_id,uploaded_by,original_file_name,storage_object_path,file_sha256,logical_dataset_sha256,source_format,parser_version,status,import_contract)
   values(account,actor,left(payload->>'file_name',250),payload->>'storage_path',payload->>'file_sha256',content_hash,payload->>'source_format','ads-import/1.0.0','staged',c) returning id into batch;
   for r in select value v from jsonb_array_elements(payload->'rows') loop
     if jsonb_typeof(r.v->'source_payload')<>'object' or r.v->>'member_name' not in ('ad_campaigns','ad_groups','ad_target_daily','ad_target_snapshots','ad_daily_summary','search_terms','keyword_plans','negative_keywords','keyword_change_log','native_campaign','native_targeting','native_search_term','native_advertised_product','native_placement','native_bulk') then raise exception 'Unsupported source table';end if;
     normalized=amazon_ads.normalize_row(r.v->>'member_name',r.v->'source_payload',c);
     insert into amazon_ads.import_rows(account_id,batch_id,member_name,row_number,source_payload,row_sha256,normalized_payload,issues,validation_status)
     values(account,batch,r.v->>'member_name',(r.v->>'row_number')::int,r.v->'source_payload',encode(sha256(convert_to((r.v->'source_payload')::text,'UTF8')),'hex'),normalized,normalized->'issues',case when jsonb_array_length(normalized->'issues')>0 then 'needs_review' else 'pending' end);
   end loop;
   insert into amazon_ads.import_events(account_id,batch_id,actor_id,event_type,detail) values(account,batch,actor,'staged',jsonb_build_object('rows',row_count));
   return jsonb_build_object('batch_id',batch,'duplicate',false);
 end if;
 batch=(payload->>'batch_id')::uuid;
 select * into strict b from amazon_ads.import_batches where id=batch and account_id=account for update;
 if action='reject' then
   if b.status='applied' then raise exception 'Applied batches are immutable';end if;
   update amazon_ads.import_batches set status='rejected',review_notes=left(payload->>'notes',4000) where id=batch;
   insert into amazon_ads.import_events(account_id,batch_id,actor_id,event_type) values(account,batch,actor,'rejected');return jsonb_build_object('status','rejected');
 end if;
 if action<>'apply' then raise exception 'Unknown action';end if;
 if b.status='applied' then return jsonb_build_object('status','applied','already_applied',true);end if;
 if b.status='rejected' or payload->>'confirm' is distinct from 'true' or length(btrim(coalesce(payload->>'notes','')))<10 then raise exception 'Review confirmation and a meaningful review note are required';end if;
 c=b.import_contract;
 if b.source_format<>'native_report' or c->>'granularity' is distinct from 'daily' or c->>'ad_product' is distinct from 'SP' or coalesce(c->>'country','') not in ('US','CA','MX') or c->>'currency' is distinct from (case c->>'country' when 'US' then 'USD' when 'CA' then 'CAD' when 'MX' then 'MXN' end) then raise exception 'Only native Sponsored Products daily campaign reports with verified country/currency can be applied';end if;
 if coalesce(c->>'source_system','') not in ('legacy_reports','unified_reporting') or nullif(c->>'attribution_model','') is null or coalesce((c->>'attribution_window_days')::int,0) not between 1 and 30 or nullif(c->>'source_generated_at','') is null or not exists(select 1 from pg_timezone_names where name=c->>'reporting_timezone') or coalesce(c->>'scope','') not in ('all_campaigns','filtered_campaigns') or nullif(c->>'sales_definition','') is null then raise exception 'Confirm source system, generation time, timezone, filters and attribution contract';end if;
 if c->>'period_start' is null or c->>'period_end' is null or (c->>'period_end')::date<(c->>'period_start')::date then raise exception 'Confirm exact report boundaries';end if;
 if not exists(select 1 from amazon_ads.import_rows where batch_id=batch) or exists(select 1 from amazon_ads.import_rows where batch_id=batch and (member_name<>'native_campaign' or normalized_payload->>'canonical_publishable' is distinct from 'true' or (normalized_payload->>'date')::date not between (c->>'period_start')::date and (c->>'period_end')::date)) then raise exception 'Resolve row issues before publishing';end if;
 if exists(select 1 from amazon_ads.import_rows where batch_id=batch group by normalized_payload->>'campaign_id',normalized_payload->>'date' having count(*)>1) then raise exception 'Duplicate campaign/day grain; remove breakdown dimensions or select a campaign-total report';end if;
 -- Restrict to native total columns: breakdown reports cannot masquerade as campaign totals.
 if exists(select 1 from amazon_ads.import_rows i,jsonb_object_keys(i.source_payload) k where i.batch_id=batch and regexp_replace(lower(k),'[^a-z0-9]','','g') in ('adgroupid','adgroupname','targeting','keyword','searchterm','placement','advertisedasin','purchasedasin','sku','portfolioid','portfolio','budgetcurrency')) then raise exception 'Breakdown dimensions are not campaign totals';end if;
 insert into amazon_ads.country_profiles(account_id,country_code,native_currency,reporting_timezone) values(account,c->>'country',c->>'currency',c->>'reporting_timezone') on conflict(account_id,country_code,account_type) do nothing;
 select id into profile from amazon_ads.country_profiles where account_id=account and country_code=c->>'country' and account_type='seller';
 insert into amazon_ads.report_versions(account_id,batch_id,member_name,report_family,source_system,ad_product,report_schema_version,granularity,period_start,period_end,source_generated_at,attribution_window_days,attribution_model,reporting_timezone,scope_filter,completeness_status,metric_schema)
 values(account,batch,'native_campaign','campaign',c->>'source_system','SP','campaign-aliases/1.0.0','daily',(c->>'period_start')::date,(c->>'period_end')::date,(c->>'source_generated_at')::timestamptz,(c->>'attribution_window_days')::int,c->>'attribution_model',c->>'reporting_timezone',jsonb_build_object('country',c->>'country','scope',c->>'scope'),'unknown',jsonb_build_object('sales',c->>'sales_definition','purchases','reported orders/purchases; units unknown')) returning id into report;
 for r in select * from amazon_ads.import_rows where batch_id=batch order by row_number loop
   normalized=r.normalized_payload;
   select cc.id into local_campaign from amazon_ads.campaign_countries cc where cc.account_id=account and cc.profile_id=profile and cc.external_country_campaign_id=normalized->>'campaign_id';
   if local_campaign is null then
     insert into amazon_ads.campaigns(account_id,source_key,name,ad_product) values(account,(c->>'country')||':'||(normalized->>'campaign_id'),coalesce(normalized->>'campaign_name',normalized->>'campaign_id'),'SP') on conflict(account_id,source_key) do update set name=excluded.name returning id into campaign;
     insert into amazon_ads.campaign_countries(account_id,campaign_id,profile_id,external_country_campaign_id) values(account,campaign,profile,normalized->>'campaign_id') returning id into local_campaign;
   end if;
   insert into amazon_ads.performance_observations(account_id,report_version_id,source_row_id,campaign_country_id,entity_key,level,granularity,period_start,period_end,currency,money_basis,native_currency,impressions,clicks,cost,attributed_sales,purchases,validation_status)
   values(account,report,r.id,local_campaign,'campaign','campaign','daily',(normalized->>'date')::date,(normalized->>'date')::date,c->>'currency','native',c->>'currency',(normalized->>'impressions')::bigint,(normalized->>'clicks')::bigint,(normalized->>'cost')::numeric,(normalized->>'attributed_sales')::numeric,(normalized->>'purchases')::bigint,'accepted');
 end loop;
 update amazon_ads.import_rows set validation_status='accepted' where batch_id=batch;
 update amazon_ads.import_batches set status='applied',approved_by=actor,approved_at=now(),review_notes=left(payload->>'notes',4000) where id=batch;
 insert into amazon_ads.import_events(account_id,batch_id,actor_id,event_type,detail) values(account,batch,actor,'applied',jsonb_build_object('notes',left(payload->>'notes',4000)));
 return jsonb_build_object('status','applied','rows',(select count(*) from amazon_ads.import_rows where batch_id=batch));
end $$;
revoke all on all functions in schema amazon_ads from public,anon,authenticated;
grant execute on function amazon_ads.can_read_account(uuid),amazon_ads.can_upload(uuid),amazon_ads.import_rpc(jsonb) to authenticated;
create function public.advertising_import(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select amazon_ads.import_rpc(payload);$$;
revoke all on function public.advertising_import(jsonb) from public,anon;
grant execute on function public.advertising_import(jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit) values('advertising-imports','advertising-imports',false,20971520) on conflict(id) do nothing;
create policy advertising_original_upload on storage.objects for insert to authenticated with check(bucket_id='advertising-imports' and (storage.foldername(name))[1]=(select auth.uid())::text and amazon_ads.can_upload(((storage.foldername(name))[2])::uuid));
create policy advertising_original_read on storage.objects for select to authenticated using(bucket_id='advertising-imports' and amazon_ads.can_upload(((storage.foldername(name))[2])::uuid));
create policy advertising_orphan_cleanup on storage.objects for delete to authenticated using(bucket_id='advertising-imports' and (storage.foldername(name))[1]=(select auth.uid())::text and amazon_ads.can_upload(((storage.foldername(name))[2])::uuid) and not exists(select 1 from amazon_ads.import_batches b where b.storage_object_path=name));
commit;
