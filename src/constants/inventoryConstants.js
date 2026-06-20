export const INVENTORY_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock', 'Discontinued'];

export const ALERT_TYPES = ['Low Stock', 'Out of Stock', 'Overstock', 'Inbound Delayed'];

export const WAREHOUSE_TYPES = ['FBA', '3PL', 'Own Warehouse', 'Dropshipper'];

export const MOVEMENT_TYPES = ['Stock In', 'Stock Out', 'Adjustment', 'Return', 'Damage', 'Recount'];

export const SHIPMENT_STATUSES = ['Draft', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled', 'Lost'];

export const STATUS_COLORS = {
  'In Stock': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Low Stock': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Out of Stock': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Overstock': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Discontinued': 'bg-slate-500/10 text-slate-500 border-slate-500/20'
};

export const ALERT_TYPE_COLORS = {
  'Low Stock': 'bg-amber-500/10 text-amber-500',
  'Out of Stock': 'bg-red-500/10 text-red-500',
  'Overstock': 'bg-blue-500/10 text-blue-500',
  'Inbound Delayed': 'bg-purple-500/10 text-purple-500'
};

export const WAREHOUSE_TYPE_COLORS = {
  'FBA': 'bg-orange-500/10 text-orange-500',
  '3PL': 'bg-indigo-500/10 text-indigo-500',
  'Own Warehouse': 'bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))]',
  'Dropshipper': 'bg-slate-500/10 text-slate-500'
};

export const MOVEMENT_TYPE_COLORS = {
  'Stock In': 'bg-emerald-500/10 text-emerald-500',
  'Stock Out': 'bg-blue-500/10 text-blue-500',
  'Adjustment': 'bg-slate-500/10 text-slate-500',
  'Return': 'bg-purple-500/10 text-purple-500',
  'Damage': 'bg-red-500/10 text-red-500',
  'Recount': 'bg-amber-500/10 text-amber-500'
};

export const SHIPMENT_STATUS_COLORS = {
  'Draft': 'bg-slate-500/10 text-slate-500',
  'Confirmed': 'bg-blue-500/10 text-blue-500',
  'In Transit': 'bg-amber-500/10 text-amber-500',
  'Delivered': 'bg-emerald-500/10 text-emerald-500',
  'Cancelled': 'bg-red-500/10 text-red-500',
  'Lost': 'bg-red-900/10 text-red-700'
};