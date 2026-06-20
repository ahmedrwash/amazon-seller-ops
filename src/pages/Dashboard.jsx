import React from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/context/AuthContext';
import { useMarketplaceContext } from '@/contexts/MarketplaceContext';
import { AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';

// Import Widgets
import PipelineSummaryWidget from '@/components/dashboard/PipelineSummaryWidget';
import TasksDueWidget from '@/components/dashboard/TasksDueWidget';
import ComplianceIssuesWidget from '@/components/dashboard/ComplianceIssuesWidget';
import LowInventoryAlertsWidget from '@/components/dashboard/LowInventoryAlertsWidget';
import HighPriorityProductsWidget from '@/components/dashboard/HighPriorityProductsWidget';
import ProviderCommunicationsWidget from '@/components/dashboard/ProviderCommunicationsWidget';

// For Finance we might need placeholders if widgets don't exist yet
const FinanceWidget = () => <div className="p-4 bg-slate-900 border border-slate-700 rounded h-full min-h-[200px] flex items-center justify-center text-slate-400">Finance Overview (Coming Soon)</div>;
const GrowthWidget = () => <div className="p-4 bg-slate-900 border border-slate-700 rounded h-full min-h-[200px] flex items-center justify-center text-slate-400">Growth Metrics (Coming Soon)</div>;

const Dashboard = () => {
  const { role, isViewer } = useRole();
  const { profile } = useAuth();
  const { selectedMarketplaceId } = useMarketplaceContext();

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Dashboard - Amazon Seller Operation</title>
      </Helmet>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {profile?.full_name}</h2>
        <p className="text-slate-400">Here's your {role} overview for today.</p>
      </div>

      {isViewer && (
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg mb-8 text-center">
           <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-white mb-2">Read Only Access</h3>
           <p className="text-slate-400">You are logged in as a Viewer. You can view data but cannot make changes.</p>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Common Widget for Everyone */}
         <HighPriorityProductsWidget selectedMarketplaceId={selectedMarketplaceId} />

         {/* Operator (admin/editor/collaborator) Widgets */}
         {(role === 'admin' || role === 'editor' || role === 'collaborator') && (
           <>
             <PipelineSummaryWidget selectedMarketplaceId={selectedMarketplaceId} />
             <TasksDueWidget selectedMarketplaceId={selectedMarketplaceId} />
             <ComplianceIssuesWidget selectedMarketplaceId={selectedMarketplaceId} />
             <LowInventoryAlertsWidget selectedMarketplaceId={selectedMarketplaceId} />
             <ProviderCommunicationsWidget selectedMarketplaceId={selectedMarketplaceId} />
           </>
         )}

         {/* Finance Widgets (admin/editor) */}
         {(role === 'admin' || role === 'editor') && (
           <>
             <FinanceWidget />
             <GrowthWidget />
           </>
         )}
         
         {/* Viewer - Show limited summary */}
         {role === 'viewer' && (
            <>
              <PipelineSummaryWidget selectedMarketplaceId={selectedMarketplaceId} /> 
              <TasksDueWidget selectedMarketplaceId={selectedMarketplaceId} />
            </>
         )}
      </div>
    </div>
  );
};

export default Dashboard;