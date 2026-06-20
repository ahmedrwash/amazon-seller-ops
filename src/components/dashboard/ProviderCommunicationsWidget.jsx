import React from 'react';
import DashboardWidget from './DashboardWidget';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useFilteredCommunications } from '@/hooks/useFilteredData';
import { getMessageTypeIcon, formatDashboardDate } from '@/utils/dashboardUtils';

const ProviderCommunicationsWidget = ({ selectedMarketplaceId, refreshTrigger, onRefresh }) => {
  const { data, loading } = useFilteredCommunications(selectedMarketplaceId);

  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      title="Communications"
      icon={MessageSquare}
      loading={loading}
      isEmpty={!hasData}
      emptyMessage="No recent messages"
      onRefresh={onRefresh}
      lastUpdated={new Date()}
    >
      <div className="divide-y divide-slate-800">
        {data.slice(0, 5).map((msg) => {
          const Icon = getMessageTypeIcon(msg.message_type);
          return (
            <div key={msg.id} className={`p-4 hover:bg-slate-800/30 transition-colors cursor-pointer ${!msg.read ? 'bg-slate-800/10' : ''}`}>
              <div className="flex gap-3">
                <div className="mt-1">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm ${!msg.read ? 'font-semibold text-white' : 'font-medium text-slate-300'} truncate`}>
                      {msg.subject}
                    </h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                      {formatDashboardDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{msg.content}</p>
                  <p className="text-xs text-slate-500 mt-2">{msg.sender_name}</p>
                </div>
              </div>
            </div>
          );
        })}
        {hasData && (
          <div className="p-3 text-center border-t border-slate-800">
             <button className="text-sm text-[hsl(var(--terracotta))] hover:text-teal-300 flex items-center justify-center gap-1 w-full">
               View All Messages <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default ProviderCommunicationsWidget;