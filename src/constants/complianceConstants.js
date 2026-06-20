export const COMPLIANCE_STATUSES = ['Missing', 'In Progress', 'Complete', 'Waived', 'N/A'];

export const READINESS_STATUSES = ['Pending', 'Complete', 'N/A'];

export const READINESS_CATEGORIES = ['Images', 'Pricing', 'Inventory', 'Listing', 'Marketing', 'Other'];

export const STATUS_COLORS = {
  'Missing': '#EF4444',     // Red
  'In Progress': '#F59E0B', // Amber/Orange
  'Complete': '#10B981',    // Green
  'Waived': '#6B7280',      // Gray
  'N/A': '#D1D5DB'          // Light Gray
};

export const COMPLIANCE_STATUS_COLORS = {
  'Missing': 'bg-red-500/10 text-red-500 border-red-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Complete': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Waived': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  'N/A': 'bg-slate-500/10 text-slate-500 border-slate-500/20'
};

export const CATEGORY_COLORS = {
  'Images': 'bg-blue-500/10 text-blue-500',
  'Pricing': 'bg-green-500/10 text-green-500',
  'Inventory': 'bg-purple-500/10 text-purple-500',
  'Listing': 'bg-indigo-500/10 text-indigo-500',
  'Marketing': 'bg-pink-500/10 text-pink-500',
  'Other': 'bg-slate-500/10 text-slate-500'
};