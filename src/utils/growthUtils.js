export const calculateAcos = (spend, sales) => {
  const s = Number(spend) || 0;
  const r = Number(sales) || 0;
  if (r === 0) return 0;
  return (s / r) * 100;
};

export const calculateTacos = (spend, sales, organicSales) => {
  const s = Number(spend) || 0;
  const totalSales = (Number(sales) || 0) + (Number(organicSales) || 0);
  if (totalSales === 0) return 0;
  return (s / totalSales) * 100;
};

export const calculateRoas = (sales, spend) => {
  const s = Number(spend) || 0;
  const r = Number(sales) || 0;
  if (s === 0) return 0;
  return r / s;
};

export const calculateCtr = (clicks, impressions) => {
  const c = Number(clicks) || 0;
  const i = Number(impressions) || 0;
  if (i === 0) return 0;
  return (c / i) * 100;
};

export const calculateCpc = (spend, clicks) => {
  const s = Number(spend) || 0;
  const c = Number(clicks) || 0;
  if (c === 0) return 0;
  return s / c;
};

export const calculateCpa = (spend, unitsSold) => {
  const s = Number(spend) || 0;
  const u = Number(unitsSold) || 0;
  if (u === 0) return 0;
  return s / u;
};

export const calculateGrowthPercent = (current, previous) => {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return 0;
  return ((c - p) / p) * 100;
};

export const calculateTrendDirection = (current, previous) => {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (c > p) return 'up';
  if (c < p) return 'down';
  return 'flat';
};

export const calculateTargetProgress = (currentValue, targetValue) => {
  const c = Number(currentValue) || 0;
  const t = Number(targetValue) || 0;
  if (t === 0) return 0;
  return Math.min(100, Math.max(0, (c / t) * 100));
};

export const getGrowthHealthStatus = (acos, roas, growth) => {
  const a = Number(acos) || 0;
  const g = Number(growth) || 0;
  if (g < 0) return 'red';
  if (a > 40) return 'red'; 
  if (g < 5 || a > 30) return 'amber';
  return 'green';
};

export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(Number(value) || 0);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((Number(value) || 0) / 100);
};

export const isHighAcos = (acos, targetAcos = 30) => (Number(acos) || 0) > targetAcos;
export const isHighRoas = (roas, targetRoas = 3) => (Number(roas) || 0) >= targetRoas;

export const generateWeeklyMetricsCSV = (metrics) => {
  if (!metrics || !metrics.length) return '';
  const headers = ['Week Start', 'Spend', 'Sales', 'ACOS', 'ROAS', 'Units', 'Impressions', 'Clicks'];
  const rows = metrics.map(m => [
    m.week_start || '',
    m.spend || 0,
    m.sales || 0,
    `${Number(m.acos || 0).toFixed(2)}%`,
    Number(m.roas || 0).toFixed(2),
    m.units_sold || 0,
    m.impressions || 0,
    m.clicks || 0
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
};

export const generateGrowthMetricsCSV = (metrics) => {
  if (!metrics || !metrics.length) return '';
  const headers = ['Period', 'Total Sales', 'Organic Sales', 'PPC Sales', 'Growth %'];
  const rows = metrics.map(m => [
    m.period || '',
    m.total_sales || 0,
    m.organic_sales || 0,
    m.ppc_sales || 0,
    `${Number(m.total_growth_percent || 0).toFixed(1)}%`
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
};