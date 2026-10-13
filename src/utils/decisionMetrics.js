import { dailyFacts, numeric, sumKnown, ratio } from './opsHubMetrics.js';

export const shiftDate = (date, days) => {
  if (!date) return null;
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
export const dateAge = (date, now = new Date()) => date
  ? Math.max(0, Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - new Date(`${date.slice(0, 10)}T00:00:00Z`)) / 86400000)) : null;
export const windowFor = (end, days = 7) => ({ start: shiftDate(end, 1 - days), end, days });
export const previousWindow = window => windowFor(shiftDate(window.start, -1), window.days);
export const within = (rows, field, window) => window.start && window.end
  ? rows.filter(row => row[field] >= window.start && row[field] <= window.end) : [];
const latest = (rows, field) => rows.map(row => row[field]).filter(Boolean).sort().at(-1) || null;
export function selectPeriod(sales, days, current, now = new Date()) {
  const end = current ? shiftDate(now.toISOString().slice(0, 10), -1) : latest(dailyFacts(sales), 'sales_date');
  return windowFor(end, days);
}
const matchWeekly = (row, pm) => row.record_type === 'ASIN' && row.owner_id === pm.owner_id && row.asin === pm.asin
  && [pm.marketplaces?.code, pm.marketplaces?.name, `Amazon ${pm.marketplaces?.code}`].filter(Boolean).includes(row.marketplace);
export const windowDays = row => row?.period_start && row?.period_end
  ? Math.round((new Date(row.period_end) - new Date(row.period_start)) / 86400000) + 1 : null;
export function weeklyPair(rows, pm) {
  const matched = rows.filter(row => matchWeekly(row, pm));
  const current = matched.filter(row => row.period_type === 'CURRENT_PERIOD')
    .sort((a, b) => String(b.period_end).localeCompare(String(a.period_end)) || String(b.imported_at).localeCompare(String(a.imported_at)))[0] || null;
  const previous = current ? matched.find(row => row.period_type === 'PREVIOUS_PERIOD'
    && row.source_file === current.source_file && row.period_end === shiftDate(current.period_start, -1)
    && windowDays(row) === windowDays(current)) || null : null;
  return { current, previous };
}
function currencyFor(rows, field, fallback) {
  if (!rows.length || rows.some(row => numeric(row[field]) == null || !row.currency)) return null;
  const currencies = [...new Set(rows.map(row => row.currency))];
  return currencies.length === 1 && currencies[0] === fallback ? fallback : null;
}
function periodMetrics(pm, data, window) {
  const sales = within(dailyFacts(data.sales || []).filter(row => row.product_marketplace_id === pm.id), 'sales_date', window);
  const ads = within((data.ads || []).filter(row => row.product_marketplace_id === pm.id), 'performance_date', window);
  const coverage = new Set(sales.map(row => row.sales_date)).size;
  const adCoverage = new Set(ads.map(row => row.performance_date)).size;
  const duplicateSales = coverage !== sales.length;
  const adKeys = ads.map(row => `${row.performance_date}:${row.campaign_id ?? 'total'}`);
  const duplicateAds = new Set(adKeys).size !== adKeys.length;
  const revenueCurrency = currencyFor(sales, 'ordered_product_sales', pm.currency);
  const adCurrency = currencyFor(ads, 'spend', pm.currency);
  const revenue = !duplicateSales && revenueCurrency ? sumKnown(sales, 'ordered_product_sales') : null;
  const units = duplicateSales ? null : sumKnown(sales, 'units_ordered');
  const sessions = duplicateSales ? null : sumKnown(sales, 'sessions');
  const spend = !duplicateAds && adCurrency ? sumKnown(ads, 'spend') : null;
  const adSales = !duplicateAds && adCurrency ? sumKnown(ads, 'ad_sales') : null;
  return { sales, ads, coverage, adCoverage, duplicateSales, duplicateAds, revenueCurrency, adCurrency,
    revenue, units, sessions, spend, adSales, conversion: ratio(units, sessions),
    acos: ratio(spend, adSales), roas: ratio(adSales, spend, 1),
    complete: coverage === window.days && !duplicateSales && revenue != null && units != null && sessions != null,
    adComplete: adCoverage === window.days && !duplicateAds && spend != null && adSales != null,
    tacos: coverage === window.days && adCoverage === window.days && !duplicateAds && !duplicateSales ? ratio(spend, revenue) : null };
}
function effective(rows, pm, date) {
  return (rows || []).filter(row => row.product_marketplace_id === pm.id && row.owner_id === pm.owner_id
    && row.effective_from <= date && (!row.effective_to || row.effective_to >= date))
    .sort((a, b) => String(b.effective_from).localeCompare(String(a.effective_from)) || String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
}
export function unitEconomics(pm, data, asOf) {
  const price = effective(data.prices, pm, asOf);
  const cost = effective(data.costs, pm, asOf);
  const fee = effective(data.fees, pm, asOf);
  const records = [price, cost, fee];
  const sameCurrency = records.every(row => row && row.currency === pm.currency);
  const values = [price?.selling_price, cost?.landed_cost, fee?.referral_fee_percent,
    fee?.fba_fulfillment_fee_per_unit, fee?.storage_fee_per_unit, fee?.other_amazon_fee_per_unit].map(numeric);
  const complete = sameCurrency && values.every(value => value != null);
  const contribution = complete ? values[0] * (1 - values[2] / 100) - values[1] - values[3] - values[4] - values[5] : null;
  return { price, cost, fee, contribution, breakEven: ratio(contribution, values[0]), complete,
    status: records.some(row => !row) ? 'Missing inputs' : records.every(row => row.data_status === 'actual') ? 'Recorded inputs' : 'Planning estimate' };
}
export function productDecision(pm, data, window, now = new Date()) {
  const metrics = periodMetrics(pm, data, window);
  const previous = periodMetrics(pm, data, previousWindow(window));
  const inventoryRows = (data.inventory || []).filter(row => row.product_marketplace_id === pm.id && row.owner_id === pm.owner_id);
  const today = now.toISOString().slice(0, 10);
  const inventory = inventoryRows.filter(row => row.snapshot_date <= today).sort((a, b) => String(b.snapshot_date).localeCompare(String(a.snapshot_date)) || String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
  const inventoryAge = dateAge(inventory?.snapshot_date, now);
  const salesAge = dateAge(latest(metrics.sales, 'sales_date'), now);
  const economics = unitEconomics(pm, data, now.toISOString().slice(0, 10));
  // Stock cover needs current, complete demand and a current snapshot.
  const stockCover = inventoryAge != null && inventoryAge <= 2 && salesAge != null && salesAge <= 2
    && metrics.complete && metrics.units > 0 && numeric(inventory?.available) != null
    ? numeric(inventory.available) / (metrics.units / window.days) : null;
  const comparable = metrics.complete && previous.complete;
  return { pm, ...metrics, previous, inventory, inventoryRows, inventoryAge, salesAge, economics, stockCover,
    revenueChange: comparable && previous.revenue > 0 ? (metrics.revenue / previous.revenue - 1) * 100 : null,
    unitChange: comparable && previous.units > 0 ? (metrics.units / previous.units - 1) * 100 : null,
    weekly: weeklyPair(data.weekly || [], pm), window };
}
export function aggregateDecisions(cards, window) {
  const currency = cards.length && cards.every(card => card.pm.currency && card.pm.currency === cards[0].pm.currency) ? cards[0].pm.currency : null;
  const revenue = currency ? sumKnown(cards, 'revenue') : null;
  const units = sumKnown(cards, 'units');
  const sessions = sumKnown(cards, 'sessions');
  const spend = currency ? sumKnown(cards, 'spend') : null;
  const adSales = currency ? sumKnown(cards, 'adSales') : null;
  const complete = cards.length > 0 && cards.every(card => card.complete);
  const adComplete = cards.length > 0 && cards.every(card => card.adComplete);
  const previousRevenue = currency ? sumKnown(cards.map(card => card.previous), 'revenue') : null;
  const comparable = complete && cards.every(card => card.previous.complete);
  const inventory = cards.length && cards.every(card => numeric(card.inventory?.available) != null)
    ? cards.reduce((total, card) => total + numeric(card.inventory.available), 0) : null;
  return { currency, revenue, units, sessions, spend, adSales, complete, adComplete, inventory,
    conversion: ratio(units, sessions), acos: ratio(spend, adSales), roas: ratio(adSales, spend, 1),
    tacos: complete && adComplete ? ratio(spend, revenue) : null,
    revenueChange: comparable && previousRevenue > 0 ? (revenue / previousRevenue - 1) * 100 : null,
    coverage: cards.reduce((total, card) => total + card.coverage, 0), expected: cards.length * window.days };
}
export function trendRows(cards, window) {
  if (!window.end) return [];
  return Array.from({ length: window.days }, (_, index) => {
    const date = shiftDate(window.start, index);
    const rows = cards.map(card => card.sales.find(row => row.sales_date === date));
    const previousDate = shiftDate(date, -window.days);
    const previous = cards.map(card => card.previous.sales.find(row => row.sales_date === previousDate));
    const currencies = [...new Set(cards.map(card => card.pm.currency))];
    const monetary = currencies.length === 1 && currencies[0];
    const currentValid = cards.length && rows.every(Boolean) && cards.every(card => !card.duplicateSales);
    const priorValid = cards.length && previous.every(Boolean) && cards.every(card => !card.previous.duplicateSales);
    return { date, previousDate, revenue: currentValid && monetary && rows.every(row => row.currency === currencies[0]) ? sumKnown(rows, 'ordered_product_sales') : null,
      previousRevenue: priorValid && monetary && previous.every(row => row.currency === currencies[0]) ? sumKnown(previous, 'ordered_product_sales') : null,
      units: currentValid ? sumKnown(rows, 'units_ordered') : null,
      sessions: currentValid ? sumKnown(rows, 'sessions') : null };
  });
}
export function priorities(cards, sourceErrors) {
  const items = [];
  for (const [source] of sourceErrors) items.push({ severity: 'Blocked', title: `${source} source unavailable`, reason: 'This source could not be read. Its indicators are unavailable.', action: 'Inspect source', section: 'quality' });
  for (const card of cards) {
    const label = `${card.pm.products?.product_name || card.pm.asin} · ${card.pm.marketplaces?.code || 'Unknown market'}`;
    if (card.salesAge == null || card.salesAge > 2 || !card.complete) items.push({ severity: 'Update needed', title: `Refresh daily sales · ${label}`, reason: `${card.coverage}/${card.window.days} dates present${card.salesAge != null ? `; latest observation ${card.salesAge} days old` : ''}. Use historical totals only.`, action: 'Review sales', section: 'sales', productId: card.pm.id });
    if (card.inventoryAge == null || card.inventoryAge > 2) items.push({ severity: 'Update needed', title: `Refresh inventory · ${label}`, reason: card.inventoryAge == null ? 'No inventory snapshot. Reorder decisions are unavailable.' : `Snapshot is ${card.inventoryAge} days old. Stock cover is withheld.`, action: 'Review inventory', section: 'stock', productId: card.pm.id });
    if (!card.adComplete) items.push({ severity: 'Missing coverage', title: `Complete advertising reports · ${label}`, reason: `${card.adCoverage}/${card.window.days} advertising dates present. Budget and TACoS decisions need complete matching coverage.`, action: 'Review advertising', section: 'ads', productId: card.pm.id });
    if (!card.economics.complete || card.economics.status !== 'Recorded inputs') items.push({ severity: 'Estimate', title: `Validate unit costs · ${label}`, reason: 'Current economics are planning inputs or incomplete. Realized profit is unavailable.', action: 'Review finance', section: 'finance', productId: card.pm.id });
  }
  return items;
}
export function csvText(rows, columns) {
  const escape = value => {
    let text = value == null ? '' : String(value);
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [columns.map(column => escape(column.label)).join(','), ...rows.map(row => columns.map(column => escape(row[column.key])).join(','))].join('\r\n');
}
