import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Package, 
  Mail, 
  MessageSquare, 
  FileText, 
  Bell,
  Box,
  ShoppingCart,
  TrendingUp,
  XCircle
} from 'lucide-react';

export const calculateDaysSince = (date) => {
  if (!date) return 0;
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const calculateDaysUntil = (date) => {
  if (!date) return 0;
  const now = new Date();
  const future = new Date(date);
  const diffTime = future - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDashboardDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'low': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  }
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'text-blue-400';
    case 'in progress': return 'text-amber-400';
    case 'resolved': return 'text-emerald-400';
    case 'closed': return 'text-slate-400';
    default: return 'text-slate-400';
  }
};

export const getBlockerTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'compliance issue': return AlertTriangle;
    case 'missing listing': return FileText;
    case 'low inventory': return Box;
    case 'pending task': return Clock;
    default: return AlertCircle;
  }
};

export const getComplianceIssueIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'documentation': return FileText;
    case 'certification': return CheckCircle2;
    case 'policy violation': return XCircle;
    default: return AlertTriangle;
  }
};

export const getMessageTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'email': return Mail;
    case 'chat': return MessageSquare;
    case 'update': return Bell;
    case 'note': return FileText;
    default: return MessageSquare;
  }
};

export const calculateInventoryDaysUntilStockout = (onHand, dailyUsage) => {
  if (!dailyUsage || dailyUsage <= 0) return 999;
  return Math.floor(onHand / dailyUsage);
};

export const groupDataByMarketplace = (data) => {
  return data.reduce((acc, item) => {
    const market = item.marketplace_name || 'Unknown';
    if (!acc[market]) acc[market] = [];
    acc[market].push(item);
    return acc;
  }, {});
};

export const filterDataByMarketplaceAndOwner = (data, marketplaces, owners) => {
  if (!data) return [];
  return data.filter(item => {
    const marketMatch = marketplaces.length === 0 || marketplaces.includes(item.marketplace_id);
    const ownerMatch = owners.length === 0 || owners.includes(item.owner_id);
    return marketMatch && ownerMatch;
  });
};

export const sortTasksByDueDate = (tasks) => {
  return [...tasks].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
};

export const sortByPriority = (items) => {
  const priorityMap = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  return [...items].sort((a, b) => {
    return (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4);
  });
};

export const sortByDateCreated = (items) => {
  return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};