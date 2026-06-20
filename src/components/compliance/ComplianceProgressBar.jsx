import React from 'react';
import { cn } from '@/lib/utils';

const ComplianceProgressBar = ({ completed, total, status = 'default' }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  let barColor = 'bg-slate-500';
  if (percentage === 100) barColor = 'bg-emerald-500';
  else if (percentage >= 50) barColor = 'bg-amber-500';
  else if (percentage > 0) barColor = 'bg-red-500';

  if (status === 'Green') barColor = 'bg-emerald-500';
  if (status === 'Amber') barColor = 'bg-amber-500';
  if (status === 'Red') barColor = 'bg-red-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 text-slate-400">
        <span>Progress</span>
        <span>{completed}/{total} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", barColor)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ComplianceProgressBar;