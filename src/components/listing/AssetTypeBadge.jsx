import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS } from '@/constants/listingConstants';

const AssetTypeBadge = ({ type }) => {
  const Icon = ASSET_TYPE_ICONS[type];
  return (
    <Badge 
      variant="outline" 
      className={cn("border-0 font-normal flex items-center gap-1", ASSET_TYPE_COLORS[type] || ASSET_TYPE_COLORS['Other'])}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {type}
    </Badge>
  );
};

export default AssetTypeBadge;