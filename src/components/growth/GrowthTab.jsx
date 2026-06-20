import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { usePpcWeekly } from '@/hooks/useGrowth';
import { useConfirm } from '@/context/ConfirmContext';
import GrowthSummaryCards from './GrowthSummaryCards';
import WeeklyEntryForm from './WeeklyEntryForm';
import WeeklyMetricsTable from './WeeklyMetricsTable';
import SalesTrendChart from './SalesTrendChart';
import AcosTrendChart from './AcosTrendChart';

export default function GrowthTab({ productId, productMarketplaceId }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { fetchWeeklyMetrics, addWeekly, deleteWeekly, loading } = usePpcWeekly();
  const [metrics, setMetrics] = useState([]);
  const { confirm } = useConfirm();

  useEffect(() => {
    if (productMarketplaceId) {
      loadData();
    }
  }, [productMarketplaceId]);

  const loadData = async () => {
    const data = await fetchWeeklyMetrics(productMarketplaceId);
    setMetrics(data);
  };

  const handleAdd = async (data) => {
    await addWeekly({ ...data, product_marketplace_id: productMarketplaceId });
    setIsFormOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete Metric', description: 'Are you sure you want to delete this metric entry?' })) {
      await deleteWeekly(id);
      loadData();
    }
  };

  const latest = metrics[0] || {};
  const summary = {
    total_sales: latest.sales || 0,
    total_spend: latest.spend || 0,
    acos: latest.acos || 0,
    roas: latest.roas || 0,
    total_units: latest.units_sold || 0,
    total_growth_percent: 0 
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-200">Growth & PPC Performance</h3>
          <Button size="sm" onClick={() => setIsFormOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
             <Plus className="w-4 h-4 mr-2" /> Add Weekly Metrics
          </Button>
       </div>

       <GrowthSummaryCards metrics={summary} />

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesTrendChart data={metrics} />
          <AcosTrendChart data={metrics} />
       </div>

       <div className="space-y-4">
          <h3 className="text-md font-medium text-slate-300">Weekly Data Log</h3>
          <WeeklyMetricsTable data={metrics} onDelete={handleDelete} />
       </div>

       <WeeklyEntryForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleAdd}
          loading={loading}
       />
    </div>
  );
}