import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyFacts, latestWeekly, productMetrics, sevenDayWindow, sumKnown } from '../src/utils/opsHubMetrics.js';

const pm = { id: 'pm', asin: 'A1', owner_id: 'owner', marketplaces: { code: 'US', name: 'Amazon US' } };
const base = { sales: [], ads: [], inventory: [], economics: [], weekly: [] };

test('calendar window excludes older rows despite sparse reporting', () => {
  const window = sevenDayWindow('2026-10-09');
  assert.deepEqual(window, { start: '2026-10-03', end: '2026-10-09' });
  const card = productMetrics(pm, { ...base, sales: [
    { product_marketplace_id: 'pm', sales_date: '2026-10-09', ordered_product_sales: 10, units_ordered: 1 },
    { product_marketplace_id: 'pm', sales_date: '2026-09-01', ordered_product_sales: 900, units_ordered: 90 }
  ] }, window);
  assert.equal(card.revenue, 10);
  assert.equal(card.coverage, 1);
  assert.equal(card.daysCover, null);
});
test('missing values stay missing while recorded zeros remain zero', () => {
  assert.equal(sumKnown([], 'spend'), null);
  assert.equal(sumKnown([{ spend: 0 }], 'spend'), 0);
  assert.equal(sumKnown([{ spend: null }, { spend: 10 }], 'spend'), null);
  const card = productMetrics(pm, base, sevenDayWindow('2026-10-09'));
  assert.equal(card.spend, null);
  assert.equal(card.revenue, null);
  assert.equal(card.acos, null);
});
test('weekly facts cannot double count daily revenue; owner and marketplace match', () => {
  const good = { owner_id: 'owner', asin: 'A1', marketplace: 'Amazon US', record_type: 'ASIN', period_type: 'CURRENT_PERIOD', period_end: '2026-10-09', revenue: 419.75 };
  const weekly = [good, { ...good, record_type: 'STORE_TOTAL' }, { ...good, period_type: 'PREVIOUS_PERIOD' }, { ...good, owner_id: 'other', period_end: '2026-10-10' }, { ...good, marketplace: 'CA', period_end: '2026-10-11' }];
  assert.equal(latestWeekly(weekly, pm), good);
  const sales = [
    { product_marketplace_id: 'pm', sales_date: '2026-10-09', source: 'daily_report', ordered_product_sales: 20, units_ordered: 1 },
    { product_marketplace_id: 'pm', sales_date: '2026-10-09', source: 'weekly_aggregate', ordered_product_sales: 419.75, units_ordered: 21 }
  ];
  assert.equal(dailyFacts(sales).length, 1);
  assert.equal(productMetrics(pm, { ...base, sales, weekly }, sevenDayWindow('2026-10-09')).revenue, 20);
});
test('zero-spend campaigns are available and TACoS needs complete coverage', () => {
  const sales = Array.from({ length: 7 }, (_, i) => ({ product_marketplace_id: 'pm', sales_date: `2026-10-0${i + 3}`, ordered_product_sales: 10, units_ordered: 1 }));
  const ads = sales.map(row => ({ product_marketplace_id: 'pm', performance_date: row.sales_date, spend: 0, ad_sales: 0 }));
  assert.equal(productMetrics(pm, { ...base, sales, ads }, sevenDayWindow('2026-10-09')).tacos, 0);
  assert.equal(productMetrics(pm, { ...base, sales, ads: ads.slice(1) }, sevenDayWindow('2026-10-09')).tacos, null);
});
