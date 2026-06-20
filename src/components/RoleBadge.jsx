import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, ROLES } from '@/constants/roleConstants';
import { formatRole } from '@/utils/roleUtils';

export default function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || ROLE_COLORS[ROLES.VIEWER];
  
  return (
    <Badge 
      style={{ backgroundColor: color }} 
      className="text-white hover:opacity-90 transition-opacity"
    >
      {formatRole(role)}
    </Badge>
  );
}