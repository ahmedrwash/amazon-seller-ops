import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';
import { COMPLIANCE_STATUSES } from '@/constants/complianceConstants';

const ComplianceFilter = ({ filters, onFilterChange }) => {
  const activeCount = Object.values(filters).filter(v => v !== 'All' && v !== null && v !== '').length;

  return (
    <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg mb-6 sticky top-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-200">Filters {activeCount > 0 && `(${activeCount})`}</h3>
        {activeCount > 0 && (
          <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => onFilterChange('reset', null)} 
             className="text-xs h-7 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3 mr-1" /> Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Status</Label>
          <Select 
            value={filters.status || 'All'} 
            onValueChange={(val) => onFilterChange('status', val === 'All' ? null : [val])}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectItem value="All">All Statuses</SelectItem>
              {COMPLIANCE_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

         <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">View</Label>
           {/* Placeholder for future expansion */}
           <div className="text-xs text-slate-600 italic">More filters coming soon</div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceFilter;