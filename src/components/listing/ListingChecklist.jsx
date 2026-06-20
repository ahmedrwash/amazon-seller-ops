import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ListingChecklist = ({ items = [], onItemClick }) => {
  // Simple grouping or just list
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Launch Readiness</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">No checklist items generated.</p>
      ) : (
        <div className="space-y-2">
           {items.map((item) => (
              <div 
                 key={item.id} 
                 className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 cursor-pointer transition-colors"
                 onClick={() => onItemClick && onItemClick(item)}
              >
                 {item.status === 'Complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                 ) : (
                    <Circle className="w-4 h-4 text-slate-600 mt-0.5" />
                 )}
                 <div>
                    <p className={cn("text-sm", item.status === 'Complete' ? "text-slate-400 line-through" : "text-slate-200")}>
                       {item.item}
                    </p>
                    {item.required && <span className="text-[10px] text-red-400 bg-red-900/10 px-1 rounded">Required</span>}
                 </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default ListingChecklist;