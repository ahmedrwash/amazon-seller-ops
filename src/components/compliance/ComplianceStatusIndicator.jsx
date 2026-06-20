import React from 'react';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle, MinusCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const ComplianceStatusIndicator = ({ 
  status, 
  missingCount, 
  inProgressCount, 
  completeCount, 
  waivedCount 
}) => {
  let icon = null;
  let colorClass = '';
  let label = '';

  switch (status) {
    case 'Red':
      icon = <AlertCircle className="w-4 h-4" />;
      colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
      label = 'Attention Needed';
      break;
    case 'Amber':
      icon = <Clock className="w-4 h-4" />;
      colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      label = 'In Progress';
      break;
    case 'Green':
      icon = <CheckCircle2 className="w-4 h-4" />;
      colorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      label = 'Compliant';
      break;
    default:
      icon = <MinusCircle className="w-4 h-4" />;
      colorClass = 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      label = 'No Data';
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-help", colorClass)}>
            {icon}
            <span>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
          <div className="text-xs space-y-1">
            <p className="font-semibold mb-1">Breakdown:</p>
            {missingCount !== undefined && <div className="flex items-center gap-2 text-red-400"><span className="w-2 h-2 bg-red-500 rounded-full"></span> {missingCount} Missing</div>}
            {inProgressCount !== undefined && <div className="flex items-center gap-2 text-amber-400"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> {inProgressCount} In Progress</div>}
            {completeCount !== undefined && <div className="flex items-center gap-2 text-emerald-400"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> {completeCount} Complete</div>}
            {waivedCount !== undefined && <div className="flex items-center gap-2 text-slate-400"><span className="w-2 h-2 bg-slate-500 rounded-full"></span> {waivedCount} Waived</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ComplianceStatusIndicator;