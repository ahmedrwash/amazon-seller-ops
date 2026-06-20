import { COST_TYPES } from '@/constants/financeConstants';

export const calculateGrossProfit = (revenue = 0, cogs = 0) => revenue - cogs;

export const calculateGrossMargin = (grossProfit = 0, revenue = 0) => {
  if (!revenue || revenue === 0) return 0;
  return (grossProfit / revenue) * 100;
};

export const calculateNetProfit = (revenue = 0, totalCosts = 0) => revenue - totalCosts;

export const calculateNetMargin = (netProfit = 0, revenue = 0) => {
  if (!revenue || revenue === 0) return 0;
  return (netProfit / revenue) * 100;
};

export const calculateAOV = (revenue = 0, unitsSold = 0) => {
  if (!unitsSold || unitsSold === 0) return 0;
  return revenue / unitsSold;
};

export const calculateCostPerUnit = (totalCosts = 0, unitsSold = 0) => {
  if (!unitsSold || unitsSold === 0) return 0;
  return totalCosts / unitsSold;
};

export const calculateProfitPerUnit = (netProfit = 0, unitsSold = 0) => {
  if (!unitsSold || unitsSold === 0) return 0;
  return netProfit / unitsSold;
};

export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value || 0);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((value || 0) / 100);
};

export const calculateTrendDirection = (current, previous) => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
};

export const calculateTargetProgress = (currentValue, targetValue) => {
  if (!targetValue || targetValue === 0) return 0;
  return Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
};

export const getFinancialHealthStatus = (netProfit, netMargin, trend) => {
  if (netProfit < 0) return 'red';
  if (netMargin < 10 && trend === 'down') return 'red';
  if (netMargin < 15) return 'amber';
  return 'green';
};

export const groupCostsByType = (costEntries) => {
  const breakdown = {};
  COST_TYPES.forEach(type => breakdown[type] = 0);
  
  costEntries.forEach(entry => {
    if (breakdown[entry.cost_type] !== undefined) {
      breakdown[entry.cost_type] += Number(entry.amount);
    } else {
       // Fallback for types not in constant
       if (!breakdown['Other']) breakdown['Other'] = 0;
       breakdown['Other'] += Number(entry.amount);
    }
  });
  return breakdown;
};

// Simplified CSV generator (no external lib)
export const generatePnLCSV = (pnlData, includeHeaders = true) => {
  const headers = ['Period', 'Revenue', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit', 'Units'];
  const rows = pnlData.map(d => [
    d.period, 
    d.revenue, 
    d.total_cogs, 
    d.gross_profit, 
    d.total_cost - d.total_cogs, 
    d.net_profit, 
    d.units_sold
  ]);
  return [includeHeaders ? headers.join(',') : null, ...rows.map(r => r.join(','))].filter(x => x).join('\n');
};