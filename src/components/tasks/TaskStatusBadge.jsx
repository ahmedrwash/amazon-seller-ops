import React from 'react';
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from '@/constants/taskConstants';
import { cn } from '@/lib/utils';

const TaskStatusBadge = ({ status, className }) => {
  return (
    <Badge 
      variant="outline" 
      className={cn(STATUS_COLORS[status] || 'bg-slate-100 text-slate-800', "whitespace-nowrap font-medium", className)}
    >
      {status}
    </Badge>
  );
};

export default TaskStatusBadge;