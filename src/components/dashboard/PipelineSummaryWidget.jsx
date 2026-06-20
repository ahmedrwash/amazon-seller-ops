import React from 'react';
import DashboardWidget from './DashboardWidget';
import { BarChart3 } from 'lucide-react';
import { useFilteredPipelineSummary } from '@/hooks/useFilteredData';

const PipelineSummaryWidget = ({ selectedMarketplaceId, refreshTrigger, onRefresh }) => {
  const { data, loading } = useFilteredPipelineSummary(selectedMarketplaceId);

  const STAGES = ['Draft', 'In Progress', 'Ready to Launch', 'Live'];
  const COLORS = {
    'Draft': 'bg-slate-600',
    'In Progress': 'bg-blue-500',
    'Ready to Launch': 'bg-amber-500',
    'Live': 'bg-emerald-500',
    'Archived': 'bg-slate-700'
  };

  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      title="Pipeline Summary"
      icon={BarChart3}
      loading={loading}
      isEmpty={!hasData}
      emptyMessage="No pipeline data found"
      onRefresh={onRefresh}
      lastUpdated={new Date()}
      className="col-span-1 md:col-span-2 lg:col-span-2"
    >
      <div className="p-4 space-y-6">
        {data.map((item) => (
          <div key={item.marketplace} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white">{item.marketplace}</span>
              <span className="text-slate-400">{item.total} Products</span>
            </div>
            
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              {STAGES.map((stage) => {
                const count = item[stage] || 0;
                if (count === 0) return null;
                const percent = (count / item.total) * 100;
                return (
                  <div 
                    key={stage}
                    className={`h-full ${COLORS[stage]}`}
                    style={{ width: `${percent}%` }}
                    title={`${stage}: ${count}`}
                  />
                );
              })}
            </div>
            
            <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
              {STAGES.map(stage => {
                 if (!item[stage]) return null;
                 return (
                   <div key={stage} className="flex items-center gap-1.5">
                     <div className={`w-2 h-2 rounded-full ${COLORS[stage]}`} />
                     <span>{stage} ({item[stage]})</span>
                   </div>
                 );
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
};

export default PipelineSummaryWidget;