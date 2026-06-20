import { 
  FileText, 
  Image, 
  Video, 
  BarChart, 
  Camera, 
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  Archive,
  FileCheck
} from 'lucide-react';

export const LISTING_STATUSES = ['Draft', 'In Review', 'Approved', 'Published', 'Archived'];

export const ASSET_STATUSES = ['Pending', 'Approved', 'Rejected', 'Published'];

export const ASSET_TYPES = ['Main Image', 'Gallery Image', 'Video', 'Infographic', 'Lifestyle', 'Other'];

export const CHECKLIST_CATEGORIES = ['Content', 'Images', 'Video', 'SEO', 'Other'];

export const LISTING_STATUS_COLORS = {
  'Draft': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  'In Review': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Approved': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Published': 'bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] border-[hsl(var(--terracotta))]/20',
  'Archived': 'bg-slate-700/10 text-slate-400 border-slate-700/20'
};

export const ASSET_STATUS_COLORS = {
  'Pending': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Approved': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Rejected': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Published': 'bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] border-[hsl(var(--terracotta))]/20'
};

export const ASSET_TYPE_COLORS = {
  'Main Image': 'bg-blue-500/10 text-blue-500',
  'Gallery Image': 'bg-indigo-500/10 text-indigo-500',
  'Video': 'bg-purple-500/10 text-purple-500',
  'Infographic': 'bg-pink-500/10 text-pink-500',
  'Lifestyle': 'bg-orange-500/10 text-orange-500',
  'Other': 'bg-slate-500/10 text-slate-500'
};

export const ASSET_TYPE_ICONS = {
  'Main Image': Image,
  'Gallery Image': Layers,
  'Video': Video,
  'Infographic': BarChart,
  'Lifestyle': Camera,
  'Other': FileText
};

export const STATUS_ICONS = {
  'Draft': FileText,
  'In Review': Clock,
  'Approved': CheckCircle,
  'Published': FileCheck,
  'Archived': Archive,
  'Rejected': XCircle
};