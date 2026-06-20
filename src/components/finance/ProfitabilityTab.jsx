import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useCostEntries, useRevenueEntries } from '@/hooks/useFinance';
import FinanceSummaryCards from './FinanceSummaryCards';
import CostEntryModal from './CostEntryModal';
import { createEmptyCostEntry } from '@/types/finance';

const ProfitabilityTab = ({ productId, productMarketplaceId }) => {
  const [costModalOpen, setCostModalOpen] = useState(false);
  
  // Hooks for data
  const { fetchCostEntries, createCostEntry } = useCostEntries();
  
  // Local state for demo/prototype metrics since we need real DB data for calculations
  const [metrics, setMetrics] = useState({
     revenue: 15000,
     netProfit: 4200,
     netMargin: 0.28,
     costPerUnit: 12.50
  });

  const handleCreateCost = async (data) => {
     // Ensure we attach the correct ID
     const payload = { ...data, product_marketplace_id: productMarketplaceId };
     await createCostEntry(payload);
     setCostModalOpen(false);
     // Re-fetch logic here
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-200">Profitability Overview</h3>
          <div className="flex gap-2">
             <Button size="sm" onClick={() => setCostModalOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                <Plus className="w-4 h-4 mr-2" /> Add Cost
             </Button>
          </div>
       </div>

       <FinanceSummaryCards metrics={metrics} />

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
             <h4 className="text-sm font-medium text-slate-400 mb-4">Monthly Trends</h4>
             <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded">
                Chart Placeholder
             </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
             <h4 className="text-sm font-medium text-slate-400 mb-4">Cost Breakdown</h4>
             <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded">
                Pie Chart Placeholder
             </div>
          </div>
       </div>

       <CostEntryModal 
          isOpen={costModalOpen} 
          onClose={() => setCostModalOpen(false)}
          onSave={handleCreateCost}
       />
    </div>
  );
};

export default ProfitabilityTab;