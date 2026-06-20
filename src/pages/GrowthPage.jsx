import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import GrowthSummaryCards from '@/components/growth/GrowthSummaryCards';
import WeeklyEntryForm from '@/components/growth/WeeklyEntryForm';
import WeeklyMetricsTable from '@/components/growth/WeeklyMetricsTable';
import SalesTrendChart from '@/components/growth/SalesTrendChart';
import AcosTrendChart from '@/components/growth/AcosTrendChart';
import RoasTrendChart from '@/components/growth/RoasTrendChart';
import { usePpcWeekly } from '@/hooks/useGrowth';
import { Helmet } from 'react-helmet';

const GrowthPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { fetchWeeklyMetrics, addWeekly, deleteWeekly } = usePpcWeekly();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchWeeklyMetrics(); // Fetch all if no ID passed
      setMetrics(data);
      setLoading(false);
    };
    load();
  }, [fetchWeeklyMetrics]);

  const handleAdd = async (data) => {
    await addWeekly(data);
    setIsFormOpen(false);
    // Reload
    const newData = await fetchWeeklyMetrics();
    setMetrics(newData);
  };
  
  const handleDelete = async (id) => {
     if(confirm('Delete this record?')) {
        await deleteWeekly(id);
        const newData = await fetchWeeklyMetrics();
        setMetrics(newData);
     }
  };

  // Aggregates for summary (naive implementation for demo)
  const totalSales = metrics.reduce((sum, m) => sum + (Number(m.sales) || 0), 0);
  const totalSpend = metrics.reduce((sum, m) => sum + (Number(m.spend) || 0), 0);
  const avgAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;

  const summaryData = {
    total_sales: totalSales,
    total_spend: totalSpend,
    acos: avgAcos,
    roas: totalSpend > 0 ? totalSales / totalSpend : 0,
    total_units: metrics.reduce((sum, m) => sum + (Number(m.units_sold) || 0), 0),
    total_growth_percent: 12.5 // Mock
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Growth - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">PPC & Growth Tracking</h2>
            <p className="text-slate-400 mt-2">Monitor ad performance, sales trends, and growth metrics.</p>
         </div>
         <Button onClick={() => setIsFormOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            <Plus className="w-4 h-4 mr-2" /> Add Metrics
         </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
         <TabsList className="bg-slate-900 border border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Metrics</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
         </TabsList>

         <TabsContent value="overview" className="mt-6 space-y-6">
            <GrowthSummaryCards metrics={summaryData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <SalesTrendChart data={metrics} />
               <AcosTrendChart data={metrics} />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
               <RoasTrendChart data={metrics} />
            </div>
         </TabsContent>

         <TabsContent value="weekly" className="mt-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
               <h3 className="text-lg font-medium text-white mb-4">Weekly Performance Log</h3>
               <WeeklyMetricsTable data={metrics} onDelete={handleDelete} />
            </div>
         </TabsContent>

         <TabsContent value="campaigns" className="mt-6">
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-lg text-slate-500">
               Campaign Management Component Placeholder
            </div>
         </TabsContent>

         <TabsContent value="insights" className="mt-6">
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-lg text-slate-500">
               Insights & Alerts Component Placeholder
            </div>
         </TabsContent>
      </Tabs>

      <WeeklyEntryForm 
         isOpen={isFormOpen}
         onClose={() => setIsFormOpen(false)}
         onSave={handleAdd}
      />
    </div>
  );
};

export default GrowthPage;