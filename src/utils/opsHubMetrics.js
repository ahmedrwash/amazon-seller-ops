export const numeric = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export const sumKnown = (rows, field) => rows.length && rows.every(row => numeric(row[field]) != null)
  ? rows.reduce((total, row) => total + numeric(row[field]), 0) : null;
export const ratio = (a, b, scale = 100) => a != null && b > 0 ? a / b * scale : null;
export const latestDate = (rows, field) => rows.map(row => row[field]).filter(Boolean).sort().at(-1) || null;
export function sevenDayWindow(end) {
  if (!end) return { start: null, end: null };
  const date = new Date(`${end}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 6);
  return { start: date.toISOString().slice(0, 10), end };
}
export const inWindow = (rows, field, window) => window.start ? rows.filter(row => row[field] >= window.start && row[field] <= window.end) : [];
export const dailyFacts = rows => rows.filter(row => !/weekly|aggregate|store_total/i.test(`${row.source || ''} ${row.record_type || ''} ${row.period_type || ''}`));
export function latestWeekly(rows, pm) {
  return rows.filter(row => row.record_type === 'ASIN' && row.period_type === 'CURRENT_PERIOD'
    && row.asin === pm.asin && row.owner_id === pm.owner_id
    && [pm.marketplaces?.code, pm.marketplaces?.name, `Amazon ${pm.marketplaces?.code}`].filter(Boolean).includes(row.marketplace))
    .sort((a, b) => String(b.period_end).localeCompare(String(a.period_end)) || String(b.imported_at).localeCompare(String(a.imported_at)))[0] || null;
}
export function freshness(date, now = new Date()) {
  if (!date) return 'Not available';
  const days = Math.max(0, Math.floor((now - new Date(`${date.slice(0, 10)}T00:00:00Z`)) / 86400000));
  return `${date.slice(0, 10)} · ${days} days old${days > 7 ? ' · Stale' : ''}`;
}
export function productMetrics(pm, data, window) {
  const sales = inWindow(dailyFacts(data.sales).filter(row => row.product_marketplace_id === pm.id), 'sales_date', window);
  const ads = inWindow(data.ads.filter(row => row.product_marketplace_id === pm.id), 'performance_date', window);
  const inv = data.inventory.filter(row => row.product_marketplace_id === pm.id)
    .sort((a, b) => String(b.snapshot_date).localeCompare(String(a.snapshot_date)) || String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
  const econ = data.economics.find(row => row.product_marketplace_id === pm.id) || null;
  const revenue = sumKnown(sales, 'ordered_product_sales');
  const units = sumKnown(sales, 'units_ordered');
  const sessions = sumKnown(sales, 'sessions');
  const spend = sumKnown(ads, 'spend');
  const adSales = sumKnown(ads, 'ad_sales');
  const coverage = new Set(sales.map(row => row.sales_date)).size;
  const adCoverage = new Set(ads.map(row => row.performance_date)).size;
  return { pm, sales, ads, inv, econ, revenue, units, sessions, spend, adSales, coverage, adCoverage,
    conversion: ratio(units, sessions), acos: ratio(spend, adSales), roas: ratio(adSales, spend, 1),
    tacos: coverage === 7 && adCoverage === 7 ? ratio(spend, revenue) : null,
    daysCover: coverage === 7 && units > 0 && numeric(inv?.available) != null ? numeric(inv.available) / (units / 7) : null,
    weekly: latestWeekly(data.weekly, pm) };
}
