import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LISTING_STATUS_COLORS, STATUS_ICONS } from '@/constants/listingConstants';

const ListingStatusBadge = ({ status }) => {
  const Icon = STATUS_ICONS[status];
  return (
    <Badge 
      variant="outline" 
      className={cn("border-0 font-medium flex items-center gap-1.5", LISTING_STATUS_COLORS[status] || LISTING_STATUS_COLORS['Draft'])}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {status}
    </Badge>
  );
};

export default ListingStatusBadge;