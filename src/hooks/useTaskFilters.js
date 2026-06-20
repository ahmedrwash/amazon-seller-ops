import { useState } from 'react';

const INITIAL_FILTERS = {
  status: [],
  owner: [],
  priority: [],
  marketplace_id: [],
  entity_type: [],
  search: '',
  dueDate: 'All',
  sortBy: 'Created Date'
};

export const useTaskFilters = () => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return {
    filters,
    updateFilter,
    resetFilters
  };
};