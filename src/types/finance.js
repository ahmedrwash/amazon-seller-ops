import { COST_TYPES, NOTE_TYPES, TARGET_TYPES, TARGET_PERIODS } from '@/constants/financeConstants';

export const createEmptyCostEntry = () => ({
  product_marketplace_id: '',
  cost_type: 'COGS',
  amount: 0,
  period: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  description: '',
  reference_id: ''
});

export const createEmptyRevenueEntry = () => ({
  product_marketplace_id: '',
  order_id: '',
  amount: 0,
  units_sold: 1,
  period: new Date().toISOString().slice(0, 10),
  order_date: new Date().toISOString().slice(0, 10),
  notes: ''
});

export const createEmptyFinancialTarget = () => ({
  product_marketplace_id: '',
  target_type: 'Revenue',
  target_value: 0,
  target_period: 'Monthly',
  start_period: new Date().toISOString().slice(0, 10),
  end_period: new Date().toISOString().slice(0, 10),
  notes: ''
});

export const createEmptyFinancialNote = () => ({
  product_marketplace_id: '',
  period: new Date().toISOString().slice(0, 10),
  note_type: 'Insight',
  content: ''
});

export const validateCostEntry = (entry) => {
  const errors = {};
  if (!entry.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!entry.cost_type || !COST_TYPES.includes(entry.cost_type)) errors.cost_type = 'Valid cost type is required';
  if (!entry.amount || entry.amount <= 0) errors.amount = 'Amount must be greater than 0';
  if (!entry.period) errors.period = 'Period is required';
  return errors;
};

export const validateRevenueEntry = (entry) => {
  const errors = {};
  if (!entry.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!entry.amount || entry.amount < 0) errors.amount = 'Amount is required';
  if (!entry.period) errors.period = 'Period is required';
  return errors;
};

export const validateFinancialTarget = (target) => {
  const errors = {};
  if (!target.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!target.target_type || !TARGET_TYPES.includes(target.target_type)) errors.target_type = 'Target type is required';
  if (!target.target_value || target.target_value <= 0) errors.target_value = 'Target value must be greater than 0';
  if (!target.target_period || !TARGET_PERIODS.includes(target.target_period)) errors.target_period = 'Period type is required';
  return errors;
};

export const validateFinancialNote = (note) => {
  const errors = {};
  if (!note.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!note.note_type || !NOTE_TYPES.includes(note.note_type)) errors.note_type = 'Note type is required';
  if (!note.content) errors.content = 'Content is required';
  return errors;
};