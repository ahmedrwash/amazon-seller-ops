import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { isOverdue } from '@/utils/productUtils';
import ComplianceStatusIndicator from '@/components/compliance/ComplianceStatusIndicator';
import { useComplianceByProductMarketplace } from '@/hooks/useComplianceByProductMarketplace';
import { useComplianceStatus } from '@/hooks/useComplianceStatus';

const KanbanCard = ({ item, index }) => {
  const navigate = useNavigate();
  // We need to fetch compliance status for this item
  const { complianceItems } = useComplianceByProductMarketplace(item.id);
  // Add defensive check for complianceItems
  const { status: complianceStatus } = useComplianceStatus(complianceItems || []);

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          onClick={() => navigate(`/products/${item.product_id}`)}
        >
          <Card 
            className={cn(
               "bg-slate-800 border-slate-700 hover:border-[hsl(var(--terracotta))]/50 transition-colors cursor-pointer group",
               snapshot.isDragging && "opacity-75 rotate-2 ring-2 ring-[hsl(var(--terracotta))] z-50"
            )}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                 <Badge variant="outline" className={cn(
                    "border-none", 
                    item.priority === 'High' || item.priority === 'Critical' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'
                 )}>
                   {item.priority || 'Medium'}
                 </Badge>
                 <ComplianceStatusIndicator status={complianceStatus} />
              </div>
              
              <h4 className="font-semibold text-slate-100 mb-1 leading-tight">{item.products?.product_name}</h4>
              <p className="text-xs text-slate-400 mb-3">{item.products?.brand}</p>
              
              <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-700/50 pt-2">
                 <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className={isOverdue(item.go_live_date) ? "text-red-400 font-bold" : ""}>
                       {item.go_live_date ? new Date(item.go_live_date).toLocaleDateString() : '-'}
                    </span>
                 </div>
                 <span>{item.marketplaces?.code}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;