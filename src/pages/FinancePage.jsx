import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import FinanceSummaryCards from '@/components/finance/FinanceSummaryCards';
import FinancialHealthIndicator from '@/components/finance/FinancialHealthIndicator';
import CostEntryModal from '@/components/finance/CostEntryModal';
import { useCostEntries } from '@/hooks/useFinance';
import { Helmet } from 'react-helmet';

const FinancePage = () => {
  const { createCostEntry } = useCostEntries();
  const [costModalOpen, setCostModalOpen] = useState(false);

  // Mock data for top level view
  const summaryMetrics = {
    revenue: 124500,
    netProfit: 32400,
    netMargin: 0.26,
    costPerUnit: 14.20
  };

  const handleCreateCost = async (data) => {
    await createCostEntry(data);
    setCostModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Finance - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Finance & Profitability</h2>
            <div className="flex items-center gap-4 mt-2">
               <p className="text-slate-400">Track revenue, costs, and margins</p>
               <FinancialHealthIndicator status="green" message="Strong profit margins this month" />
            </div>
         </div>
         <Button onClick={() => setCostModalOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            <Plus className="w-4 h-4 mr-2" /> Add Cost
         </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
         <TabsList className="bg-slate-900 border border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pnl">P&L Statement</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
         </TabsList>

         <TabsContent value="overview" className="mt-6 space-y-6">
            <FinanceSummaryCards metrics={summaryMetrics} />
            
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
               <h3 className="text-lg font-medium text-white mb-4">Top Products by Profit</h3>
               <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded">
                  Top Products Table Placeholder
               </div>
            </div>
         </TabsContent>

         <TabsContent value="pnl" className="mt-6">
            <div className="p-8 text-center border border-dashed border-slate-700 rounded bg-slate-900/30 text-slate-400">
               Full P&L Table Component
            </div>
         </TabsContent>

         <TabsContent value="costs" className="mt-6">
            <div className="p-8 text-center border border-dashed border-slate-700 rounded bg-slate-900/30 text-slate-400">
               Cost Analysis Component
            </div>
         </TabsContent>

         <TabsContent value="targets" className="mt-6">
            <div className="p-8 text-center border border-dashed border-slate-700 rounded bg-slate-900/30 text-slate-400">
               Targets Component
            </div>
         </TabsContent>
      </Tabs>

      <CostEntryModal 
         isOpen={costModalOpen}
         onClose={() => setCostModalOpen(false)}
         onSave={handleCreateCost}
      />
    </div>
  );
};

export default FinancePage;