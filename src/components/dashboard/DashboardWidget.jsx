import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import WidgetHeader from './WidgetHeader';
import WidgetLoadingState from './WidgetLoadingState';
import WidgetErrorState from './WidgetErrorState';
import WidgetEmptyState from './WidgetEmptyState';
import { AnimatePresence, motion } from 'framer-motion';

const DashboardWidget = ({
  title,
  icon,
  loading,
  error,
  isEmpty,
  emptyMessage,
  emptyAction,
  onRefresh,
  lastUpdated,
  className = "",
  children
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card className={`bg-slate-900 border-slate-800 overflow-hidden flex flex-col h-full ${className}`}>
      <WidgetHeader 
        title={title}
        icon={icon}
        onRefresh={onRefresh}
        lastUpdated={lastUpdated}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isLoading={loading}
      />
      
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            <div className="h-full">
              {loading ? (
                <WidgetLoadingState />
              ) : error ? (
                <WidgetErrorState message={error.message} onRetry={onRefresh} />
              ) : isEmpty ? (
                <WidgetEmptyState message={emptyMessage} actionLabel={emptyAction?.label} onAction={emptyAction?.handler} />
              ) : (
                <div className="p-0 h-full">{children}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default DashboardWidget;