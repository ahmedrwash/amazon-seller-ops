import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSET_STATUS_COLORS } from '@/constants/listingConstants';

const AssetStatusBadge = ({ status }) => {
  return (
    <Badge 
      variant="outline" 
      className={cn("border-0 font-normal text-[10px]", ASSET_STATUS_COLORS[status] || ASSET_STATUS_COLORS['Pending'])}
    >
      {status}
    </Badge>
  );
};

export default AssetStatusBadge;