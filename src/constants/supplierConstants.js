export const INCOTERMS = ['FOB', 'CIF', 'DDP', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDU'];

export const DOCUMENT_TYPES = ['Certificate', 'Invoice', 'Agreement', 'Compliance', 'Other'];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'INR', 'AUD', 'CAD'];

export const SAMPLE_STATUSES = ['Requested', 'Received', 'Approved', 'Rejected', 'N/A'];

export const STATUS_COLORS = {
  'Requested': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  'Received': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Approved': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Rejected': 'bg-red-500/10 text-red-500 border-red-500/20',
  'N/A': 'bg-slate-500/10 text-slate-500 border-slate-500/20'
};

export const DOCUMENT_TYPE_COLORS = {
  'Certificate': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Invoice': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Agreement': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Compliance': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Other': 'bg-slate-500/10 text-slate-500 border-slate-500/20'
};