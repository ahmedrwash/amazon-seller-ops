import React from 'react';
import { Activity, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const InventoryHealthIndicator = ({ health = 'Unknown' }) => {
  let color = 'text-slate-500';
  let bgColor = 'bg-slate-500/10';
  let Icon = Activity;
  let label = 'Unknown Status';

  if (health === 'Healthy') {
     color = 'text-emerald-500';
     bgColor = 'bg-emerald-500/10';
     Icon = CheckCircle;
     label = 'Healthy Inventory';
  } else if (health === 'Warning') {
     color = 'text-amber-500';
     bgColor = 'bg-amber-500/10';
     Icon = AlertTriangle;
     label = 'Attention Needed';
  } else if (health === 'Critical') {
     color = 'text-red-500';
     bgColor = 'bg-red-500/10';
     Icon = AlertCircle;
     label = 'Critical Issues';
  }

  return (
    <TooltipProvider>
      <Tooltip>
         <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent hover:border-slate-700 transition-colors", bgColor)}>
               <Icon className={cn("w-4 h-4", color)} />
               <span className={cn("text-sm font-medium", color)}>{label}</span>
            </div>
         </TooltipTrigger>
         <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
            <p>Overall inventory health based on stock levels.</p>
         </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InventoryHealthIndicator;