import { isBefore, startOfDay } from 'date-fns';

export const isItemOverdue = (dueDate) => {
  if (!dueDate) return false;
  return isBefore(new Date(dueDate), startOfDay(new Date()));
};

export const calculateComplianceStatus = (items = []) => {
  if (!items || items.length === 0) return 'Green'; // Default to green if no requirements

  const hasMissing = items.some(i => i.status === 'Missing');
  const hasOverdue = items.some(i => isItemOverdue(i.due_date) && i.status !== 'Complete' && i.status !== 'Waived');
  
  if (hasMissing || hasOverdue) return 'Red';

  const hasInProgress = items.some(i => i.status === 'In Progress');
  if (hasInProgress) return 'Amber';

  return 'Green';
};

export const isComplianceComplete = (items = []) => {
  if (!items || items.length === 0) return true;
  return items.every(i => i.status === 'Complete' || i.status === 'Waived' || i.status === 'N/A');
};

export const getOverdueItems = (items = []) => {
  return items.filter(i => 
    isItemOverdue(i.due_date) && 
    i.status !== 'Complete' && 
    i.status !== 'Waived' && 
    i.status !== 'N/A'
  );
};

export const formatComplianceProgress = (items = []) => {
  if (!items || items.length === 0) return '0/0 Complete';
  const completed = items.filter(i => i.status === 'Complete' || i.status === 'Waived' || i.status === 'N/A').length;
  return `${completed}/${items.length} Complete`;
};

export const getComplianceStatusColor = (status) => {
  switch (status) {
    case 'Red': return '#EF4444';
    case 'Amber': return '#F59E0B';
    case 'Green': return '#10B981';
    default: return '#6B7280';
  }
};