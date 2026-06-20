import React from 'react';
import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLORS } from '@/constants/taskConstants';
import { cn } from '@/lib/utils';

const TaskPriorityBadge = ({ priority, className }) => {
  return (
    <Badge 
      variant="outline" 
      className={cn(PRIORITY_COLORS[priority] || 'bg-slate-100', "whitespace-nowrap font-medium text-xs", className)}
    >
      {priority}
    </Badge>
  );
};

export default TaskPriorityBadge;