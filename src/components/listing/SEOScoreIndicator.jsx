import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SEOScoreIndicator = ({ score, recommendations = [] }) => {
  let color = 'text-red-500';
  let bgColor = 'bg-red-500/10';
  
  if (score >= 50) { color = 'text-amber-500'; bgColor = 'bg-amber-500/10'; }
  if (score >= 80) { color = 'text-emerald-500'; bgColor = 'bg-emerald-500/10'; }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full cursor-help", bgColor)}>
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-800" />
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" 
                  strokeDasharray={88} 
                  strokeDashoffset={88 - (88 * score) / 100} 
                  className={color} 
                />
              </svg>
              <span className={cn("absolute text-[10px] font-bold", color)}>{score}</span>
            </div>
            <span className={cn("text-xs font-medium", color)}>SEO Score</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
          <div className="text-xs space-y-1">
             <p className="font-semibold mb-2">Recommendations:</p>
             {recommendations.length > 0 ? (
               <ul className="list-disc pl-4 space-y-1">
                 {recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
               </ul>
             ) : (
               <p className="text-emerald-400">Great job! Listing is optimized.</p>
             )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SEOScoreIndicator;