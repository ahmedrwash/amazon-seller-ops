import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FinancialHealthIndicator = ({ status = 'green', trend = 'flat', message = 'Finances are healthy' }) => {
  let color = 'text-emerald-500';
  let bgColor = 'bg-emerald-500/10';
  let Icon = CheckCircle;

  if (status === 'amber') {
    color = 'text-amber-500';
    bgColor = 'bg-amber-500/10';
    Icon = AlertTriangle;
  } else if (status === 'red') {
    color = 'text-red-500';
    bgColor = 'bg-red-500/10';
    Icon = TrendingDown;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent hover:border-slate-700 transition-colors cursor-help", bgColor)}>
            <Icon className={cn("w-4 h-4", color)} />
            <span className={cn("text-sm font-medium", color)}>
              {status === 'green' ? 'Healthy' : status === 'amber' ? 'Caution' : 'Critical'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FinancialHealthIndicator;