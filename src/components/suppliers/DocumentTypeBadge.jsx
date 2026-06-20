import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPE_COLORS } from '@/constants/supplierConstants';

const DocumentTypeBadge = ({ type }) => {
  return (
    <Badge 
      variant="outline" 
      className={cn("border-0 font-normal", DOCUMENT_TYPE_COLORS[type] || DOCUMENT_TYPE_COLORS['Other'])}
    >
      {type}
    </Badge>
  );
};

export default DocumentTypeBadge;