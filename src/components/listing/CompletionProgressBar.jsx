import React from 'react';
import { cn } from '@/lib/utils';

const CompletionProgressBar = ({ percentage }) => {
  let color = 'bg-red-500';
  if (percentage >= 50) color = 'bg-amber-500';
  if (percentage >= 80) color = 'bg-[hsl(var(--terracotta))]';
  if (percentage === 100) color = 'bg-emerald-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 text-slate-400">
        <span>Completion</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", color)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default CompletionProgressBar;