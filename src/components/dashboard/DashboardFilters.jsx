import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AutoRefreshToggle from './AutoRefreshToggle';

const DashboardFilters = ({ 
  filters, 
  onUpdateFilters, 
  onRefreshAll, 
  autoRefresh, 
  onToggleAutoRefresh 
}) => {
  // Placeholder for filter dropdowns - in a real app would map to marketplace lists
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white">
          <Filter className="w-4 h-4 mr-2" />
          Marketplaces
        </Button>
        <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white">
           <Filter className="w-4 h-4 mr-2" />
           Owners
        </Button>
        {(filters.marketplaces.length > 0 || filters.owners.length > 0) && (
           <Button 
             variant="ghost" 
             onClick={() => onUpdateFilters({ marketplaces: [], owners: [] })}
             className="text-xs text-slate-400 hover:text-red-400 h-auto py-1"
           >
             Clear All
           </Button>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <AutoRefreshToggle enabled={autoRefresh} onToggle={onToggleAutoRefresh} />
        
        <Button onClick={onRefreshAll} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default DashboardFilters;