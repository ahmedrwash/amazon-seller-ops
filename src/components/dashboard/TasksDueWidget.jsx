import React from 'react';
import DashboardWidget from './DashboardWidget';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import { useFilteredTasksDue } from '@/hooks/useFilteredData';
import { Badge } from '@/components/ui/badge';
import { calculateDaysUntil } from '@/utils/dashboardUtils';

const TasksDueWidget = ({ selectedMarketplaceId, refreshTrigger, onRefresh }) => {
  const { data, loading } = useFilteredTasksDue(selectedMarketplaceId);

  const getDueColor = (days) => {
    if (days < 0) return 'text-red-400';
    if (days <= 2) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const hasData = data && data.length > 0;

  return (
    <DashboardWidget
      title="Upcoming Tasks"
      icon={CalendarCheck}
      loading={loading}
      isEmpty={!hasData}
      emptyMessage="No upcoming tasks"
      onRefresh={onRefresh}
      lastUpdated={new Date()}
    >
      <div className="divide-y divide-slate-800">
        {data.slice(0, 6).map((task) => {
          const daysLeft = calculateDaysUntil(task.due_date);
          return (
            <div key={task.id} className="p-4 hover:bg-slate-800/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-medium text-white truncate group-hover:text-[hsl(var(--terracotta))]">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {task.priority} Priority • Assg to: {task.owner || 'Unassigned'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${getDueColor(daysLeft)}`}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {hasData && (
          <div className="p-3 text-center border-t border-slate-800">
             <button className="text-sm text-[hsl(var(--terracotta))] hover:text-teal-300 flex items-center justify-center gap-1 w-full">
               View All Tasks <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default TasksDueWidget;