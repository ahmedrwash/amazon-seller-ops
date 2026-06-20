import React from 'react';
import { Badge } from "@/components/ui/badge";
import { isOverdue } from '@/utils/taskUtils';

const OverdueTaskBadge = ({ dueDate, status }) => {
  if (!isOverdue(dueDate, status)) return null;
  return (
    <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider">
      Overdue
    </Badge>
  );
};

export default OverdueTaskBadge;