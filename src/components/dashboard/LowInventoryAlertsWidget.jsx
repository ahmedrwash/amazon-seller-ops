import React from 'react';
import DashboardWidget from './DashboardWidget';
import { BoxSelect, ArrowRight } from 'lucide-react';
import { useFilteredLowInventory } from '@/hooks/useFilteredData';
import { Badge } from '@/components/ui/badge';

const LowInventoryAlertsWidget = ({ selectedMarketplaceId, refreshTrigger, onRefresh }) => {
  const { data, loading } = useFilteredLowInventory(selectedMarketplaceId);

  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      title="Low Inventory"
      icon={BoxSelect}
      loading={loading}
      isEmpty={!hasData}
      emptyMessage="Inventory levels healthy"
      onRefresh={onRefresh}
      lastUpdated={new Date()}
    >
      <div className="divide-y divide-slate-800">
        {data.slice(0, 5).map((item) => (
          <div key={item.id} className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-sm font-medium text-white">{item.product_name}</h4>
                <p className="text-xs text-slate-500">{item.marketplace} • {item.warehouse}</p>
              </div>
              <Badge variant="outline" className={item.on_hand === 0 ? "border-red-500 text-red-500" : "border-amber-500 text-amber-500"}>
                {item.on_hand} units
              </Badge>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full ${item.on_hand === 0 ? 'bg-red-500' : 'bg-amber-500'}`} 
                style={{ width: `${Math.min(100, (item.on_hand / (item.reorder_point * 1.5)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
               <span>Reorder Point: {item.reorder_point}</span>
               <span>~{item.days_until_stockout} days left</span>
            </div>
          </div>
        ))}
        {hasData && (
          <div className="p-3 text-center border-t border-slate-800">
             <button className="text-sm text-[hsl(var(--terracotta))] hover:text-teal-300 flex items-center justify-center gap-1 w-full">
               View Inventory <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default LowInventoryAlertsWidget;