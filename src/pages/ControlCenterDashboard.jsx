import React, { useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useDashboardFilters, useDashboardRefresh, useAutoRefresh } from '@/hooks/useDashboard';
import DashboardFilters from '@/components/dashboard/DashboardFilters';

// Widgets
import PipelineSummaryWidget from '@/components/dashboard/PipelineSummaryWidget';
import HighPriorityProductsWidget from '@/components/dashboard/HighPriorityProductsWidget';
import TasksDueWidget from '@/components/dashboard/TasksDueWidget';
import ComplianceIssuesWidget from '@/components/dashboard/ComplianceIssuesWidget';
import LowInventoryAlertsWidget from '@/components/dashboard/LowInventoryAlertsWidget';
import ProviderCommunicationsWidget from '@/components/dashboard/ProviderCommunicationsWidget';

const ControlCenterDashboard = () => {
  const { user } = useAuth();
  const { filters, updateFilters } = useDashboardFilters();
  const { refreshTrigger, refresh } = useDashboardRefresh();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  useAutoRefresh(autoRefreshEnabled, 300000, refresh);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[hsl(var(--terracotta))]/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Control Center</h1>
              <p className="text-slate-400 mt-1">Welcome back, <span className="text-[hsl(var(--terracotta))] font-medium">{userName}</span></p>
            </div>
            <div className="text-slate-500 text-sm font-medium">
              {currentDate}
            </div>
          </div>
        </div>

        <DashboardFilters 
          filters={filters}
          onUpdateFilters={updateFilters}
          onRefreshAll={refresh}
          autoRefresh={autoRefreshEnabled}
          onToggleAutoRefresh={setAutoRefreshEnabled}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[minmax(350px,auto)]">
          {/* Row 1: Key Metrics & Pipeline */}
          <div className="col-span-1 md:col-span-2 xl:col-span-2">
            <PipelineSummaryWidget refreshTrigger={refreshTrigger} onRefresh={refresh} />
          </div>
          
          <HighPriorityProductsWidget refreshTrigger={refreshTrigger} onRefresh={refresh} />
          
          {/* Row 2: Operational Tasks */}
          <TasksDueWidget refreshTrigger={refreshTrigger} onRefresh={refresh} />
          
          <ComplianceIssuesWidget refreshTrigger={refreshTrigger} onRefresh={refresh} />
          
          <LowInventoryAlertsWidget refreshTrigger={refreshTrigger} onRefresh={refresh} />

          {/* Row 3: Communications */}
          <ProviderCommunicationsWidget refreshTrigger={refreshTrigger} onRefresh={refresh} />
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-600">
           Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ControlCenterDashboard;