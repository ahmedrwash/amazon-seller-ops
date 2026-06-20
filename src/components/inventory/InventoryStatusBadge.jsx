import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getInventoryStatusColor } from '@/utils/inventoryUtils';

const InventoryStatusBadge = ({ status }) => {
  return (
    <Badge 
      variant="outline" 
      className={cn("border-0 font-medium whitespace-nowrap", getInventoryStatusColor(status))}
    >
      {status}
    </Badge>
  );
};

export default InventoryStatusBadge;