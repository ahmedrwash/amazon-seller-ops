import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { DOMParser } from '@xmldom/xmldom';
import { PGlite } from '@electric-sql/pglite';
import { parseDelimited, readAdvertisingFile, unzipSelected } from '../src/utils/advertisingFiles.js';
globalThis.DOMParser=DOMParser;
function zip(files,method=8){
 const pieces=[],directory=[];let offset=0;
 for(const [name,text] of Object.entries(files)){
  const nameBytes=Buffer.from(name),raw=Buffer.from(text),compressed=method===8?deflateRawSync(raw):raw;
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(method,8);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(raw.length,22);header.writeUInt16LE(nameBytes.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(method,10);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(raw.length,24);central.writeUInt16LE(nameBytes.length,28);central.writeUInt32LE(offset,42);
  pieces.push(header,nameBytes,compressed);directory.push(central,nameBytes);offset+=header.length+nameBytes.length+compressed.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(Buffer.concat(directory).length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...pieces,...directory,end]);
}
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
test('CSV preserves escaped commas/newlines, IDs, missing and zero, rejects malformed input',()=>{
 const rows=parseDelimited('\uFEFFCampaign ID,Clicks,Note\r\n001234,0,"a,b\n""quoted"""\r\n001235,,none');
 assert.equal(rows[0].source_payload['Campaign ID'],'001234');assert.equal(rows[0].source_payload.Clicks,'0');assert.equal(rows[1].source_payload.Clicks,'');assert.equal(rows[0].source_payload.Note,'a,b\n"quoted"');
 assert.throws(()=>parseDelimited('a,a\n1,2'),/duplicate/);assert.throws(()=>parseDelimited('a\n"unclosed'),/Unclosed/);
});
test('Bounded ZIP/curated XLSX read data only; original columns retained',async()=>{
 const bytes=zip({'ad_campaigns.csv':'campaign_key,amazon_campaign_id\nx,A000001','not_advertising.csv':'secret\nignored'});
 const result=await readAdvertisingFile(file('export.zip',bytes));assert.equal(result.rows.length,1);assert.equal(result.rows[0].member_name,'ad_campaigns');
 const xlsx=zip({'xl/workbook.xml':'<workbook xmlns:r="r"><sheets><sheet name="ad_campaigns" r:id="r1"/></sheets></workbook>','xl/_rels/workbook.xml.rels':'<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>','xl/worksheets/sheet1.xml':'<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>campaign_key</t></is></c><c r="B1" t="inlineStr"><is><t>amazon_campaign_id</t></is></c></row><row><c r="A2" t="inlineStr"><is><t>x</t></is></c><c r="B2" t="inlineStr"><is><t>A000001</t></is></c></row></sheetData></worksheet>'});
 const workbook=await readAdvertisingFile(file('export.xlsx',xlsx));assert.deepEqual(workbook.rows,result.rows);
 const invalid=Buffer.from(bytes);invalid.writeUInt32LE(999999999,invalid.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]))+24);
 await assert.rejects(unzipSelected(invalid,()=>true),/oversized/);await assert.rejects(readAdvertisingFile(file('bad.zip',Buffer.from('bad'))),/Invalid ZIP/);
});
test('RPC staging, deduplication, atomic apply, contract checks, RLS and source history',async()=>{
 const db=new PGlite();const user='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',viewer='10000000-0000-4000-8000-000000000003';
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key,role text,active boolean);create table public.user_module_permissions(user_id uuid,module_id text,can_view boolean,can_create boolean);
 create table public.legal_entities(id uuid primary key);create table public.product_marketplaces(id uuid primary key);
 create function public.is_admin() returns boolean language sql security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and active)$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 create function storage.foldername(name text) returns text[] language sql as $$select string_to_array(name,'/')$$;
 alter table storage.objects enable row level security;grant usage on schema auth,storage to authenticated;grant select,insert,delete on storage.objects to authenticated;
 insert into auth.users values('${user}'),('${other}'),('${viewer}');insert into public.profiles values('${user}','admin',true),('${other}','editor',true),('${viewer}','viewer',true);`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261025122430_amazon_ads_import_core.sql',import.meta.url),'utf8'));
 const auth=async id=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);
 const rpc=async payload=>(await db.query('select public.advertising_import($1::jsonb) result',[JSON.stringify(payload)])).rows[0].result;
 await auth(user);const account=(await rpc({action:'create_account',name:'Test seller'})).account_id;
 const contract={ad_product:'SP',country:'US',currency:'USD',granularity:'daily',source_system:'unified_reporting',period_start:'2026-10-01',period_end:'2026-10-10',source_generated_at:'2026-10-20T00:00:00Z',reporting_timezone:'America/Los_Angeles',attribution_window_days:'7',attribution_model:'test last touch',sales_definition:'total attributed sales',scope:'all_campaigns'};
 const row={member_name:'native_campaign',row_number:2,source_payload:{'Campaign ID':'A0000001','Campaign Name':'Test campaign',Date:'2026-10-10',Impressions:'100',Clicks:'10',Spend:'20',Sales:'80',Orders:'2'}};
 let counter=0;
 async function stage(rows=[row],c=contract,format='native_report'){
  const path=`${user}/${account}/file-${++counter}.csv`;
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['advertising-imports',path]);
  return rpc({action:'stage',account_id:account,storage_path:path,file_name:'test.csv',file_sha256:'a'.repeat(64),source_format:format,contract:c,rows});
 }
 const staged=await stage();const duplicate=await stage();assert.equal(duplicate.duplicate,true);assert.equal(duplicate.batch_id,staged.batch_id);
 assert.equal((await rpc({action:'detail',account_id:account,batch_id:staged.batch_id})).rows[0].normalized_payload.cost,20);
 await assert.rejects(rpc({action:'apply',account_id:account,batch_id:staged.batch_id,confirm:true,notes:'short'}),/review note/i);
 await rpc({action:'apply',account_id:account,batch_id:staged.batch_id,confirm:true,notes:'Checked native report, dates, country and attribution.'});
 assert.equal((await rpc({action:'apply',account_id:account,batch_id:staged.batch_id,confirm:true,notes:'Retry applied report.'})).already_applied,true);
 const metrics=(await rpc({action:'metrics',account_id:account})).rows;assert.equal(metrics.length,1);assert.equal(Number(metrics[0].cpc),2);assert.equal(Number(metrics[0].roas),4);
 const bad=await stage([{...row,source_payload:{...row.source_payload,'Campaign ID':'A0000002',Clicks:''}}]);await assert.rejects(rpc({action:'apply',account_id:account,batch_id:bad.batch_id,confirm:true,notes:'Check missing metrics test.'}),/Resolve row issues/);
 const missingContract=await stage([{...row,source_payload:{...row.source_payload,'Campaign ID':'A0000003'}}],{});await assert.rejects(rpc({action:'apply',account_id:account,batch_id:missingContract.batch_id,confirm:true,notes:'Missing contract test.'}),/Only native/);
 const duplicateRows=await stage([row,{...row,row_number:3}]);await assert.rejects(rpc({action:'apply',account_id:account,batch_id:duplicateRows.batch_id,confirm:true,notes:'Duplicate grain test.'}),/Duplicate campaign/);
 const breakdown=await stage([{...row,source_payload:{...row.source_payload,'Campaign ID':'A0000004',Placement:'Top'}}]);await assert.rejects(rpc({action:'apply',account_id:account,batch_id:breakdown.batch_id,confirm:true,notes:'Breakdown rejection test.'}),/Breakdown/);
 const wrongCurrency=await stage([{...row,source_payload:{...row.source_payload,'Campaign ID':'A0000005',Currency:'CAD'}}]);await assert.rejects(rpc({action:'apply',account_id:account,batch_id:wrongCurrency.batch_id,confirm:true,notes:'Currency mismatch test.'}),/Resolve row issues/);
 assert.equal((await rpc({action:'metrics',account_id:account})).rows.length,1);
 const curved=await stage([{member_name:'search_terms',row_number:2,source_payload:{search_term:'test',clicks:'',period_note:'lifetime'}}],{},'curated_zip');const detail=await rpc({action:'detail',account_id:account,batch_id:curved.batch_id});assert.equal(detail.rows[0].normalized_payload.clicks,null);assert(detail.rows[0].issues.includes('exact_period_bounds_required'));
 await assert.rejects(rpc({action:'apply',account_id:account,batch_id:curved.batch_id,confirm:true,notes:'Curated not publishable.'}),/Only native/);
 await db.exec('reset role');await db.query('insert into amazon_ads.account_memberships values($1,$2,$3)',[account,viewer,'viewer']);await auth(viewer);
 assert.equal((await rpc({action:'list',account_id:account})).batches.length,7);
 await assert.rejects(rpc({action:'detail',account_id:account,batch_id:staged.batch_id}),/editor access/);await assert.rejects(rpc({action:'stage',account_id:account,rows:[row]}),/Upload permission/);
 assert.equal((await db.query('select * from amazon_ads.import_rows')).rows.length,0);
 await auth(other);await assert.rejects(rpc({action:'metrics',account_id:account}),/membership/);assert.equal((await db.query('select * from amazon_ads.campaign_daily_metrics')).rows.length,0);
 await auth(user);await db.exec('reset role');await db.query('insert into public.user_module_permissions values($1,$2,false,false)',[user,'ops_hub']);await auth(user);await assert.rejects(rpc({action:'list',account_id:account}),/access denied/);
 }finally{await db.close();}
});
