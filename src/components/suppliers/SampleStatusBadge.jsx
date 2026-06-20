import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_COLORS } from '@/constants/supplierConstants';

const SampleStatusBadge = ({ status }) => {
  return (
    <Badge 
      variant="outline" 
      className={cn("border-0 font-normal capitalize", STATUS_COLORS[status] || STATUS_COLORS['N/A'])}
    >
      {status}
    </Badge>
  );
};

export default SampleStatusBadge;