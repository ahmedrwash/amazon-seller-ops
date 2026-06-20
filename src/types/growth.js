import { CAMPAIGN_TYPES, INSIGHT_TYPES, TARGET_TYPES, TARGET_PERIODS } from '@/constants/growthConstants';

export const createEmptyPpcWeekly = () => ({
  product_marketplace_id: '',
  week_start: new Date().toISOString().slice(0, 10),
  spend: 0,
  sales: 0,
  units_sold: 0,
  impressions: 0,
  clicks: 0,
  organic_sales: 0,
  notes: ''
});

export const createEmptyCampaign = () => ({
  product_marketplace_id: '',
  campaign_name: '',
  campaign_type: 'Sponsored Products',
  status: 'Active',
  daily_budget: 0,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  target_acos: 0,
  target_roas: 0,
  notes: ''
});

export const createEmptyGrowthMetric = () => ({
  product_marketplace_id: '',
  period: new Date().toISOString().slice(0, 10),
  period_type: 'weekly',
  total_sales: 0,
  organic_sales: 0,
  ppc_sales: 0,
  total_units: 0,
  organic_units: 0,
  ppc_units: 0,
  total_spend: 0,
  ppc_spend: 0,
  acos: 0,
  tacos: 0,
  roas: 0,
  organic_growth_percent: 0,
  ppc_growth_percent: 0,
  total_growth_percent: 0,
  rank_position: 0
});

export const createEmptyGrowthTarget = () => ({
  product_marketplace_id: '',
  target_type: 'Sales',
  target_value: 0,
  target_period: 'Monthly',
  start_period: new Date().toISOString().slice(0, 10),
  end_period: '',
  notes: ''
});

export const createEmptyGrowthInsight = () => ({
  product_marketplace_id: '',
  insight_type: 'Trend',
  title: '',
  description: '',
  metric_name: '',
  metric_value: 0,
  period: new Date().toISOString().slice(0, 10),
  priority: 'Medium',
  notes: ''
});

export const validatePpcWeekly = (weekly) => {
  const errors = {};
  if (!weekly.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!weekly.week_start) errors.week_start = 'Week start date is required';
  if (weekly.spend < 0) errors.spend = 'Spend cannot be negative';
  if (weekly.sales < 0) errors.sales = 'Sales cannot be negative';
  return errors;
};

export const validateCampaign = (campaign) => {
  const errors = {};
  if (!campaign.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!campaign.campaign_name) errors.campaign_name = 'Campaign name is required';
  if (!campaign.campaign_type || !CAMPAIGN_TYPES.includes(campaign.campaign_type)) errors.campaign_type = 'Valid type is required';
  if (campaign.daily_budget < 0) errors.daily_budget = 'Budget cannot be negative';
  return errors;
};

export const validateGrowthTarget = (target) => {
  const errors = {};
  if (!target.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!target.target_type || !TARGET_TYPES.includes(target.target_type)) errors.target_type = 'Target type is required';
  if (target.target_value <= 0) errors.target_value = 'Target value must be greater than 0';
  if (!target.target_period || !TARGET_PERIODS.includes(target.target_period)) errors.target_period = 'Period is required';
  return errors;
};

export const validateGrowthInsight = (insight) => {
  const errors = {};
  if (!insight.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!insight.insight_type || !INSIGHT_TYPES.includes(insight.insight_type)) errors.insight_type = 'Insight type is required';
  if (!insight.title) errors.title = 'Title is required';
  return errors;
};