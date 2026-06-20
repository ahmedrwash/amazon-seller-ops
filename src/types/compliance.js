export const createEmptyComplianceItem = () => ({
  product_marketplace_id: '',
  requirement: '',
  status: 'Missing',
  owner: '',
  due_date: null,
  notes: ''
});

export const createEmptyReadinessItem = () => ({
  product_marketplace_id: '',
  item: '',
  status: 'Pending',
  category: 'Other',
  notes: ''
});

export const validateComplianceItem = (item) => {
  const errors = {};
  if (!item.requirement) errors.requirement = 'Requirement is required';
  if (!item.product_marketplace_id) errors.product_marketplace_id = 'Product Marketplace is required';
  return errors;
};

export const validateReadinessItem = (item) => {
  const errors = {};
  if (!item.item) errors.item = 'Item description is required';
  if (!item.product_marketplace_id) errors.product_marketplace_id = 'Product Marketplace is required';
  return errors;
};