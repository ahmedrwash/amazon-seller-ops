import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, History, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function CashFlowTab({ selectedProduct }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    starting_cash: 0,
    launch_month_gmv: 0,
    monthly_gmv_growth_rate: 0,
    amazon_payout_delay_days: 0,
    variable_cost_percent_gmv: 0,
    monthly_ppc_budget: 0,
    reorder_cost: 0
  });
  const [originalData, setOriginalData] = useState(null);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadMasterData = useCallback(async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: mData, error: loadError } = await supabase
        .from('cashflow_master_data')
        .select('*')
        .eq('product_id', selectedProduct)
        .maybeSingle();

      if (loadError && loadError.code !== 'PGRST116') throw loadError;
      
      let loadedData = mData;
      
      // Auto-initialize if no data exists for this product
      if (!loadedData) {
        const initialData = {
          product_id: selectedProduct,
          starting_cash: 0,
          launch_month_gmv: 0,
          monthly_gmv_growth_rate: 0,
          amazon_payout_delay_days: 0,
          variable_cost_percent_gmv: 0,
          monthly_ppc_budget: 0,
          reorder_cost: 0,
          created_by: userId
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('cashflow_master_data')
          .insert(initialData)
          .select()
          .single();
          
        if (insertError) throw insertError;
        loadedData = newData;
      }

      setData({
        starting_cash: loadedData.starting_cash || 0,
        launch_month_gmv: loadedData.launch_month_gmv || 0,
        monthly_gmv_growth_rate: loadedData.monthly_gmv_growth_rate || 0,
        amazon_payout_delay_days: loadedData.amazon_payout_delay_days || 0,
        variable_cost_percent_gmv: loadedData.variable_cost_percent_gmv || 0,
        monthly_ppc_budget: loadedData.monthly_ppc_budget || 0,
        reorder_cost: loadedData.reorder_cost || 0
      });
      setOriginalData(loadedData);
    } catch (err) {
      console.error("Error loading master cashflow:", err);
      setError(err.message || "Failed to load cashflow data");
    } finally {
      setLoading(false);
    }
  }, [selectedProduct]);

  const loadHistory = useCallback(async () => {
    if (!selectedProduct) return;
    try {
      const { data: hData, error } = await supabase
        .from('cashflow_master_history')
        .select('*')
        .eq('product_id', selectedProduct)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(hData || []);
    } catch (err) {
      console.error("Error loading cashflow history:", err);
      toast({ title: "Failed to load history", variant: "destructive" });
    }
  }, [selectedProduct, toast]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, loadHistory]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const changedFields = [];
      const oldValues = {};
      const newValues = {};

      Object.keys(data).forEach(key => {
        if (data[key] !== originalData?.[key]) {
          changedFields.push(key);
          oldValues[key] = originalData?.[key] || 0;
          newValues[key] = data[key];
        }
      });

      const { error: upsertError } = await supabase
        .from('cashflow_master_data')
        .upsert({
          product_id: selectedProduct,
          starting_cash: data.starting_cash,
          launch_month_gmv: data.launch_month_gmv,
          monthly_gmv_growth_rate: data.monthly_gmv_growth_rate,
          amazon_payout_delay_days: data.amazon_payout_delay_days,
          variable_cost_percent_gmv: data.variable_cost_percent_gmv,
          monthly_ppc_budget: data.monthly_ppc_budget,
          reorder_cost: data.reorder_cost,
          created_by: userId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id' });

      if (upsertError) throw upsertError;

      if (changedFields.length > 0) {
        const { error: histError } = await supabase
          .from('cashflow_master_history')
          .insert({
            product_id: selectedProduct,
            old_values: oldValues,
            new_values: newValues,
            changed_fields: changedFields,
            changed_by: userId
          });
        
        if (histError) throw histError;
      }

      setOriginalData({ ...originalData, ...data });
      if (showHistory) loadHistory();
      toast({ title: "Cashflow data saved successfully" });
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Error saving data", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const monthlyData = useMemo(() => {
    const result = [];
    let currentCash = data.starting_cash || 0;
    let currentGmv = data.launch_month_gmv || 0;
    const varCostPct = data.variable_cost_percent_gmv || 0;
    const ppcBudget = data.monthly_ppc_budget || 0;
    const reorderCost = data.reorder_cost || 0;
    const monthlyGrowth = data.monthly_gmv_growth_rate || 0;

    for (let i = 1; i <= 12; i++) {
      const netRev = currentGmv * (1 - (varCostPct / 100));
      const isReorder = i % 2 === 0;
      const reorder = isReorder ? reorderCost : 0;
      const totalOut = ppcBudget + reorder;
      const netCash = netRev - totalOut;
      currentCash += netCash;

      result.push({
        month: i,
        gmv: currentGmv,
        netRev,
        ppc: ppcBudget,
        reorder,
        totalOut,
        netCash,
        balance: currentCash
      });

      currentGmv *= (1 + (monthlyGrowth / 100));
    }
    return result;
  }, [data]);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Cashflow Data</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error}</p>
          <Button variant="outline" onClick={loadMasterData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 border-[hsl(var(--border))]">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="col-span-2 border-[hsl(var(--border))]">
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Inputs */}
      <Card className="col-span-1 shadow-sm border-[hsl(var(--border))] h-fit">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-heading text-[hsl(var(--cinder))]">Master Cash Flow</CardTitle>
            <CardDescription>Baseline parameters for projection.</CardDescription>
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            starting_cash: 'Starting Cash ($)', 
            launch_month_gmv: 'Launch Month GMV ($)', 
            monthly_gmv_growth_rate: 'Monthly Growth Rate (%)', 
            variable_cost_percent_gmv: 'Variable Cost (% of GMV)',
            amazon_payout_delay_days: 'Payout Delay (Days)', 
            monthly_ppc_budget: 'Monthly PPC Budget ($)', 
            reorder_cost: 'Reorder Cost (Even Mos) ($)'
          }).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
              <Input 
                type="number" 
                name={key} 
                value={data[key]} 
                onChange={handleChange} 
                className="font-mono-num h-9 text-sm" 
                step="any" 
              />
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide Change History' : 'Show Change History'}
            {showHistory ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>

      {/* Right Column: Projection & History */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
        
        {/* Change History Collapsible */}
        {showHistory && (
          <Card className="shadow-sm border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading text-[hsl(var(--cinder))]">Change History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm opacity-60">No changes recorded yet.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {history.map(record => (
                    <div key={record.id} className="border-b pb-4 last:border-0 border-[hsl(var(--border))]">
                      <div className="text-xs text-[hsl(var(--cinder))] opacity-60 mb-2">
                        Changed at: {new Date(record.changed_at).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-3 rounded-md">
                        <div className="font-medium text-slate-700">Field</div>
                        <div className="font-medium text-slate-700">Old Value</div>
                        <div className="font-medium text-slate-700">New Value</div>
                        {record.changed_fields?.map(field => (
                          <React.Fragment key={field}>
                            <div className="opacity-80 break-words">{field}</div>
                            <div className="text-red-600 line-through font-mono-num">{record.old_values?.[field] ?? 'N/A'}</div>
                            <div className="text-green-600 font-mono-num">{record.new_values?.[field] ?? 'N/A'}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 12-Month Projection Table */}
        <Card className="shadow-sm border-[hsl(var(--border))] overflow-hidden">
          <CardHeader className="bg-[hsl(var(--stone-light))] pb-4 border-b border-[hsl(var(--border))]">
            <CardTitle className="text-xl font-heading text-[hsl(var(--cinder))]">12-Month Projection Summary</CardTitle>
            <CardDescription>Based on baseline master parameters.</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[hsl(var(--stone-light))] text-[hsl(var(--cinder))] font-mono-num border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium">GMV</th>
                  <th className="px-4 py-3 font-medium">Net Rev (In)</th>
                  <th className="px-4 py-3 font-medium">PPC Out</th>
                  <th className="px-4 py-3 font-medium">Reorder Out</th>
                  <th className="px-4 py-3 font-medium">Net CashFlow</th>
                  <th className="px-4 py-3 font-medium">Cash Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {monthlyData.map((m) => (
                  <tr key={m.month} className="font-mono-num hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">M{m.month}</td>
                    <td className="px-4 py-3 text-[hsl(var(--stone-foreground))] opacity-80">{formatCurrency(m.gmv)}</td>
                    <td className="px-4 py-3 text-[hsl(var(--green))]">{formatCurrency(m.netRev)}</td>
                    <td className="px-4 py-3 text-red-600/80">{formatCurrency(m.ppc)}</td>
                    <td className="px-4 py-3 text-red-600/80">{m.reorder > 0 ? formatCurrency(m.reorder) : '-'}</td>
                    <td className={`px-4 py-3 font-medium ${m.netCash >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                      {m.netCash >= 0 ? '+' : ''}{formatCurrency(m.netCash)}
                    </td>
                    <td className={`px-4 py-3 font-bold ${m.balance >= 0 ? 'text-[hsl(var(--cinder))]' : 'text-[hsl(var(--red))] bg-[hsl(var(--red-light))]'}`}>
                      {formatCurrency(m.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
    </div>
  );
}