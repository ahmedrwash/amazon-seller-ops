import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateDecisions, csvText, productDecision, selectPeriod, trendRows, unitEconomics, weeklyPair, windowFor } from '../src/utils/decisionMetrics.js';

const pm = { id:'pm', owner_id:'owner', asin:'A1', currency:'USD', marketplaces:{code:'US',name:'Amazon US'} };
const base = { sales:[], ads:[], inventory:[], weekly:[], prices:[], costs:[], fees:[] };
const now = new Date('2026-10-13T03:00:00Z');
const sales = (start=24, days=7, id='pm') => Array.from({length:days},(_,i)=>({product_marketplace_id:id,sales_date:`2026-09-${String(start+i).padStart(2,'0')}`,ordered_product_sales:20,units_ordered:2,sessions:10,currency:'USD',source:'daily_report'}));
test('recorded and current windows distinguish stale history from missing recent records',()=>{
  assert.deepEqual(selectPeriod(sales(),7,false,now),{start:'2026-09-24',end:'2026-09-30',days:7});
  const current=selectPeriod(sales(),7,true,now);
  assert.deepEqual(current,{start:'2026-10-06',end:'2026-10-12',days:7});
  assert.equal(productDecision(pm,{...base,sales:sales()},current,now).revenue,null);
});
test('comparison requires two complete equal calendar windows',()=>{
  const window=windowFor('2026-09-30');
  const card=productDecision(pm,{...base,sales:[...sales(17),...sales()]},window,now);
  assert.equal(card.revenueChange,0);
  const incomplete=productDecision(pm,{...base,sales:[...sales(17,6),...sales()]},window,now);
  assert.equal(incomplete.revenueChange,null);
  assert.equal(incomplete.revenue,140);
});
test('duplicate fact grain withholds totals instead of double counting',()=>{
  const rows=sales();
  const card=productDecision(pm,{...base,sales:[...rows,rows[0]]},windowFor('2026-09-30'),now);
  assert.equal(card.duplicateSales,true);
  assert.equal(card.revenue,null);
  assert.equal(card.complete,false);
});
test('weighted session rates and mixed currencies are handled separately',()=>{
  const other={...pm,id:'pm2',currency:'EUR'};
  const rows=[...sales(),...sales(24,7,'pm2').map(row=>({...row,currency:'EUR',units_ordered:1,sessions:20}))];
  const window=windowFor('2026-09-30');
  const cards=[pm,other].map(product=>productDecision(product,{...base,sales:rows},window,now));
  const total=aggregateDecisions(cards,window);
  assert.equal(total.revenue,null);
  assert.equal(total.units,21);
  assert.equal(total.conversion,10);
  assert.equal(trendRows(cards,window)[0].revenue,null);
});
test('nulls remain unavailable while observed zero remains zero',()=>{
  const window=windowFor('2026-09-30');
  const zero=productDecision(pm,{...base,sales:sales().map(row=>({...row,ordered_product_sales:0,units_ordered:0}))},window,now);
  assert.equal(zero.revenue,0);
  const missing=productDecision(pm,{...base,sales:sales().map((row,i)=>i?row:{...row,ordered_product_sales:null})},window,now);
  assert.equal(missing.revenue,null);
});
test('old inventory cannot support current stock cover',()=>{
  const card=productDecision(pm,{...base,sales:sales(),inventory:[{product_marketplace_id:'pm',owner_id:'owner',snapshot_date:'2026-08-22',available:179}]},windowFor('2026-09-30'),now);
  assert.equal(card.inventory.available,179);
  assert.equal(card.stockCover,null);
});
test('economics excludes future versions and does not zero-fill a missing fee',()=>{
  const version={product_marketplace_id:'pm',owner_id:'owner',effective_from:'2026-01-01',effective_to:null,currency:'USD',data_status:'planned'};
  const data={...base,prices:[{...version,selling_price:25},{...version,effective_from:'2027-01-01',selling_price:99}],costs:[{...version,landed_cost:8}],fees:[{...version,referral_fee_percent:15,fba_fulfillment_fee_per_unit:4,storage_fee_per_unit:0,other_amazon_fee_per_unit:0}]};
  const result=unitEconomics(pm,data,'2026-10-13');
  assert.equal(result.price.selling_price,25);
  assert.equal(result.contribution,9.25);
  assert.equal(result.status,'Planning estimate');
  data.fees[0].storage_fee_per_unit=null;
  assert.equal(unitEconomics(pm,data,'2026-10-13').contribution,null);
});
test('weekly comparison excludes overlapping reports and owner or market mismatch',()=>{
  const current={owner_id:'owner',asin:'A1',marketplace:'Amazon US',record_type:'ASIN',period_type:'CURRENT_PERIOD',period_start:'2026-10-03',period_end:'2026-10-09',source_file:'weekly.csv'};
  const good={...current,period_type:'PREVIOUS_PERIOD',period_start:'2026-09-26',period_end:'2026-10-02'};
  const overlap={...good,period_start:'2026-09-27',period_end:'2026-10-03'};
  assert.equal(weeklyPair([current,overlap],pm).previous,null);
  assert.equal(weeklyPair([current,good,{...current,owner_id:'other',period_end:'2026-10-15'}],pm).previous,good);
});
test('chart gaps and duplicate null-campaign advertising remain unavailable',()=>{
  const window=windowFor('2026-09-30');
  const ad={product_marketplace_id:'pm',campaign_id:null,performance_date:'2026-09-30',spend:0,ad_sales:0,currency:'USD'};
  const card=productDecision(pm,{...base,sales:sales(24,6),ads:[ad,{...ad}]},window,now);
  assert.equal(card.spend,null);
  assert.equal(trendRows([card],window).at(-1).revenue,null);
});
test('CSV preserves nulls and protects against spreadsheet formula execution',()=>{
  const text=csvText([{value:'=SUM(A1)',other:null}],[{key:'value',label:'Value'},{key:'other',label:'Other'}]);
  assert.equal(text,'"Value","Other"\r\n"\'=SUM(A1)",""');
});
