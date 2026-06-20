import React from 'react';
import DashboardWidget from './DashboardWidget';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useFilteredComplianceIssues } from '@/hooks/useFilteredData';
import { Badge } from '@/components/ui/badge';
import { getComplianceIssueIcon } from '@/utils/dashboardUtils';

const ComplianceIssuesWidget = ({ selectedMarketplaceId, refreshTrigger, onRefresh }) => {
  const { data, loading } = useFilteredComplianceIssues(selectedMarketplaceId);

  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      title="Compliance Issues"
      icon={ShieldAlert}
      loading={loading}
      isEmpty={!hasData}
      emptyMessage="No active compliance issues"
      onRefresh={onRefresh}
      lastUpdated={new Date()}
    >
      <div className="divide-y divide-slate-800">
        {data.slice(0, 5).map((item) => {
          const Icon = getComplianceIssueIcon(item.issue_type);
          return (
            <div key={item.id} className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
              <div className="flex gap-3">
                <div className="mt-1">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-white truncate">
                      {item.product_name}
                    </h4>
                    <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-0 text-[10px]">
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                    <span>{item.marketplace}</span>
                    <span>•</span>
                    <span>{item.status}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {hasData && (
          <div className="p-3 text-center border-t border-slate-800">
             <button className="text-sm text-[hsl(var(--terracotta))] hover:text-teal-300 flex items-center justify-center gap-1 w-full">
               View All Issues <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default ComplianceIssuesWidget;