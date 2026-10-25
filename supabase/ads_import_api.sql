-- App integration for amazon_ads. Included in the generated core migration.
begin;
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
 if action in ('update_contract','apply') and b.status<>'applied' and payload->'expected_contract' is distinct from b.import_contract then raise exception 'Report contract changed. Reopen the batch and review its latest settings';end if;
 if action='update_contract' then
   if b.status<>'staged' or jsonb_typeof(payload->'contract') is distinct from 'object' or length(btrim(coalesce(payload->>'notes','')))<10 then raise exception 'Only staged reports can have their contract corrected, with a review note';end if;
   c=payload->'contract';
   update amazon_ads.import_batches set import_contract=c,review_notes=left(payload->>'notes',4000) where id=batch;
   for r in select * from amazon_ads.import_rows where batch_id=batch loop
     normalized=amazon_ads.normalize_row(r.member_name,r.source_payload,c);
     update amazon_ads.import_rows set normalized_payload=normalized,issues=normalized->'issues',validation_status=case when jsonb_array_length(normalized->'issues')>0 then 'needs_review' else 'pending' end where id=r.id;
   end loop;
   insert into amazon_ads.import_events(account_id,batch_id,actor_id,event_type,detail) values(account,batch,actor,'contract_corrected',jsonb_build_object('previous_contract',b.import_contract,'contract',c,'notes',left(payload->>'notes',4000)));
   return jsonb_build_object('status','staged');
 end if;
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
