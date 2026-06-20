import React from 'react';
import DashboardWidget from './DashboardWidget';
import { AlertOctagon, ArrowRight } from 'lucide-react';
import { useFilteredHighPriority } from '@/hooks/useFilteredData';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor, getBlockerTypeIcon, calculateDaysSince } from '@/utils/dashboardUtils';

const HighPriorityProductsWidget = ({ selectedMarketplaceId, refreshTrigger, onRefresh }) => {
  const { data, loading } = useFilteredHighPriority(selectedMarketplaceId);

  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      title="High Priority Products"
      icon={AlertOctagon}
      loading={loading}
      isEmpty={!hasData}
      emptyMessage="No blocked products"
      onRefresh={onRefresh}
      lastUpdated={new Date()}
    >
      <div className="divide-y divide-slate-800">
        {data.slice(0, 5).map((item) => {
          const BlockerIcon = getBlockerTypeIcon(item.blocker_type);
          return (
            <div key={item.id} className="p-4 hover:bg-slate-800/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-white group-hover:text-[hsl(var(--terracotta))] transition-colors">
                  {item.product_name}
                </h4>
                <Badge variant="outline" className={`${getPriorityColor(item.priority)} border-0`}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">{item.marketplace}</p>
              
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded">
                <BlockerIcon className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{item.blocker_desc}</span>
              </div>
              
              <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                <span>Open for {calculateDaysSince(item.created_at)} days</span>
                <span>{item.owner}</span>
              </div>
            </div>
          );
        })}
        {hasData && (
          <div className="p-3 text-center border-t border-slate-800">
             <button className="text-sm text-[hsl(var(--terracotta))] hover:text-teal-300 flex items-center justify-center gap-1 w-full">
               View All Blockers <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default HighPriorityProductsWidget;