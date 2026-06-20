import { isBefore, startOfToday, parseISO, formatDistanceToNow, isValid } from 'date-fns';

export const isOverdue = (dueDate, status) => {
  if (!dueDate || !status) return false;
  const isDone = ['Done', 'Cancelled'].includes(status);
  if (isDone) return false;
  
  const today = startOfToday();
  const due = parseISO(dueDate);
  return isValid(due) && isBefore(due, today);
};

export const formatRelativeDate = (dateString) => {
  if (!dateString) return '-';
  const date = parseISO(dateString);
  if (!isValid(date)) return '-';
  
  const today = startOfToday();
  if (isBefore(date, today) && !['Done', 'Cancelled'].includes(date.status)) {
    return `Overdue (${formatDistanceToNow(date, { addSuffix: true })})`;
  }
  return formatDistanceToNow(date, { addSuffix: true });
};

export const getTaskCountByStatus = (tasks) => {
  return tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    acc.Total = (acc.Total || 0) + 1;
    return acc;
  }, {});
};

export const filterTasks = (tasks, filters) => {
  if (!tasks) return [];
  
  return tasks.filter(task => {
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDesc = task.description?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesDesc) return false;
    }

    // Multi-select filters (arrays)
    if (filters.status?.length > 0 && !filters.status.includes(task.status)) return false;
    if (filters.priority?.length > 0 && !filters.priority.includes(task.priority)) return false;
    if (filters.owner?.length > 0 && !filters.owner.includes(task.owner)) return false;
    if (filters.marketplace_id?.length > 0 && !filters.marketplace_id.includes(task.marketplace_id)) return false;
    if (filters.entity_type?.length > 0 && !filters.entity_type.includes(task.entity_type)) return false;

    // Due Date logic (simplified for string selection)
    if (filters.dueDate && filters.dueDate !== 'All') {
       const taskDate = task.due_date ? parseISO(task.due_date) : null;
       const today = startOfToday();
       const isTaskOverdue = taskDate && isBefore(taskDate, today);

       if (filters.dueDate === 'Overdue' && !isTaskOverdue) return false;
       // Add logic for 'Today', 'This Week' etc. using date-fns helpers if needed
    }

    return true;
  });
};

export const sortTasks = (tasks, sortBy) => {
  if (!tasks) return [];
  const sorted = [...tasks];
  
  switch (sortBy) {
    case 'Due Date':
      return sorted.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    case 'Priority': {
      const pMap = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      return sorted.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
    }
    case 'Created Date':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    default:
      return sorted;
  }
};