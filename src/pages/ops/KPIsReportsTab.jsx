import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function KPIsReportsTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [formData, setFormData] = useState({
    gmv_this_week: 0, units_sold_this_week: 0, ppc_spend_this_week: 0, ppc_revenue_this_week: 0, 
    total_reviews: 0, average_star_rating: 0, primary_keyword_rank: 0, bsr: 0, inventory_at_fba: 0
  });
  const [checks, setChecks] = useState(Array(8).fill(false));

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setFormData({
        gmv_this_week: weeklyData.gmv_this_week || 0,
        units_sold_this_week: weeklyData.units_sold_this_week || 0,
        ppc_spend_this_week: weeklyData.ppc_spend_this_week || 0,
        ppc_revenue_this_week: weeklyData.ppc_revenue_this_week || 0,
        total_reviews: weeklyData.total_reviews || 0,
        average_star_rating: weeklyData.average_star_rating || 0,
        primary_keyword_rank: weeklyData.primary_keyword_rank || 0,
        bsr: weeklyData.bsr || 0,
        inventory_at_fba: weeklyData.inventory_at_fba || 0
      });
      if (weeklyData.checklist) setChecks(weeklyData.checklist);
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('kpis_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: parseFloat(e.target.value) || 0});
  };

  const handleCheckChange = (i) => {
    const nc = [...checks]; 
    nc[i] = !nc[i]; 
    setChecks(nc);
  };

  const handleSave = () => {
    onSaveWeekly('kpis', {
      ...formData,
      checklist: checks 
    });
  };

  const checklistItems = [
    "Inventory Reorder Check", "PPC Search Term Review", "Listing Hijacker Check", "Coupon/Promo Expiration Check",
    "Customer Messages Replied (<24h)", "Negative Review Follow-up", "Account Health Dashboard Green", "Reimbursement Cases Filed"
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))] lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Week {selectedWeek} Metrics</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Weekly
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {Object.keys(formData).map((key) => (
              <div key={key}>
                <Label className="text-xs uppercase tracking-wider text-[hsl(var(--cinder))] opacity-70">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Input type="number" name={key} value={formData[key]||0} onChange={handleChange} className="font-mono-num h-8 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
            <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Week {selectedWeek} Delivery Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checklistItems.map((item, i) => (
                <label key={i} className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${checks[i] ? 'border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta-light))]/20' : 'border-transparent hover:bg-[hsl(var(--stone-light))]'}`}>
                  <input type="checkbox" checked={checks[i]||false} onChange={() => handleCheckChange(i)} className="w-4 h-4 text-[hsl(var(--terracotta))] rounded focus:ring-[hsl(var(--terracotta))]" />
                  <span className={`text-sm ${checks[i] ? 'line-through opacity-60 text-[hsl(var(--terracotta))]' : 'text-[hsl(var(--cinder))]'}`}>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {showHistory && (
            <div className="bg-white p-6 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
              <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Change History (Week {selectedWeek})</h3>
              {history.length === 0 ? (
                <p className="text-sm opacity-60">No changes recorded yet.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {history.map(record => (
                    <div key={record.id} className="border-b pb-4 last:border-0">
                      <div className="text-xs text-[hsl(var(--cinder))] opacity-60 mb-2">
                        Changed at: {new Date(record.changed_at).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="font-medium border-b pb-1">Field</div>
                        <div className="font-medium border-b pb-1">Old Value</div>
                        <div className="font-medium border-b pb-1">New Value</div>
                        {record.changed_fields?.map(field => (
                          <React.Fragment key={field}>
                            <div className="opacity-80">{field}</div>
                            <div className="text-red-600 line-through">{String(record.old_values?.[field] ?? 'N/A')}</div>
                            <div className="text-green-600">{String(record.new_values?.[field] ?? 'N/A')}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}