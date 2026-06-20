import { PRODUCT_STAGES, PRIORITY_COLORS } from '@/constants/productConstants';

export const getStageIndex = (stage) => {
  return PRODUCT_STAGES.indexOf(stage);
};

export const getStageColor = (stage) => {
  // Can be expanded to have specific colors for stages if needed
  return 'bg-slate-700 text-slate-200';
};

export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-800 border-slate-200';
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

export const calculateStageProgress = (currentStage) => {
  const index = getStageIndex(currentStage);
  if (index === -1) return 0;
  return ((index + 1) / PRODUCT_STAGES.length) * 100;
};

export const filterProductsByMarketplace = (products, marketplaceId) => {
  if (!marketplaceId) return products;
  // This logic assumes products have a nested product_marketplaces array or we filter at API level
  // For frontend filtering of a flat list:
  return products.filter(p => 
    p.product_marketplaces?.some(pm => pm.marketplace_id === marketplaceId)
  );
};

export const filterProductsByPriority = (products, priorities) => {
  if (!priorities || priorities.length === 0) return products;
  // Needs product level priority or check marketplaces
  return products;
};

export const filterProductsByOwner = (products, owners) => {
  if (!owners || owners.length === 0) return products;
  return products.filter(p => owners.includes(p.created_by));
};

export const searchProducts = (products, searchTerm) => {
  if (!searchTerm) return products;
  const lowerTerm = searchTerm.toLowerCase();
  return products.filter(p => 
    p.product_name.toLowerCase().includes(lowerTerm) || 
    p.brand?.toLowerCase().includes(lowerTerm)
  );
};