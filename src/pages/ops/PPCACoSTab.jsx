import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function PPCACoSTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    ppc_spend: 0,
    ppc_revenue: 0,
    total_revenue: 0,
    clicks: 0,
    orders_from_ppc: 0,
    target_acos_percent: 0,
    net_margin_per_unit: 0
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        ppc_spend: weeklyData.ppc_spend || 0,
        ppc_revenue: weeklyData.ppc_revenue || 0,
        total_revenue: weeklyData.total_revenue || 0,
        clicks: weeklyData.clicks || 0,
        orders_from_ppc: weeklyData.orders_from_ppc || 0,
        target_acos_percent: weeklyData.target_acos_percent || 0,
        net_margin_per_unit: weeklyData.net_margin_per_unit || 0
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('ppc_acos_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSave = () => {
    onSaveWeekly('ppc', data);
  };

  const price = weeklyData?.selling_price || 0;

  const { acos, tacos, roas, cvr, cpc, cpa, targetMaxBid, ppcProfit } = useMemo(() => {
    const a = data.ppc_revenue > 0 ? (data.ppc_spend / data.ppc_revenue) * 100 : 0;
    const t = data.total_revenue > 0 ? (data.ppc_spend / data.total_revenue) * 100 : 0;
    const r = data.ppc_spend > 0 ? (data.ppc_revenue / data.ppc_spend) : 0;
    const cv = data.clicks > 0 ? (data.orders_from_ppc / data.clicks) * 100 : 0;
    const cp = data.clicks > 0 ? (data.ppc_spend / data.clicks) : 0;
    const c = data.orders_from_ppc > 0 ? (data.ppc_spend / data.orders_from_ppc) : 0;
    
    const maxCpa = price * (data.target_acos_percent / 100);
    const maxBid = maxCpa * (cv / 100);
    const profit = (data.orders_from_ppc * (price * (data.net_margin_per_unit / 100))) - data.ppc_spend;
    
    return { acos: a, tacos: t, roas: r, cvr: cv, cpc: cp, cpa: c, targetMaxBid: maxBid, ppcProfit: profit };
  }, [data, price]);

  const getAcosStatus = (val) => {
    if (val <= data.target_acos_percent) return 'pill-green';
    if (val <= data.target_acos_percent + 10) return 'pill-gold';
    return 'pill-red';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Week {selectedWeek} PPC Data</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Weekly
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries({
              ppc_spend: 'PPC Spend ($)', ppc_revenue: 'PPC Revenue ($)', total_revenue: 'Total Acct Revenue ($)',
              clicks: 'Total Clicks', orders_from_ppc: 'PPC Orders', target_acos_percent: 'Target ACoS (%)', net_margin_per_unit: 'Net Margin/Unit (%)'
            }).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
                <Input type="number" name={key} value={data[key]} onChange={handleChange} className="font-mono-num mt-1 h-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">ACoS</p>
            <span className={getAcosStatus(acos)}>{formatPercent(acos)}</span>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">TACoS</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatPercent(tacos)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">ROAS</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{roas.toFixed(2)}x</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">CVR</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatPercent(cvr)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">CPC</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(cpc)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">CPA</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(cpa)}</p>
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
                          <div className="text-red-600 line-through">{record.old_values?.[field] ?? 'N/A'}</div>
                          <div className="text-green-600">{record.new_values?.[field] ?? 'N/A'}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-[hsl(var(--cinder))] text-white p-6 rounded-[var(--radius)] shadow-sm">
          <h3 className="font-heading text-xl mb-4 text-[hsl(var(--parchment))]">Bid Guidance & Profitability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm opacity-80">Target Max Bid</p>
              <p className="text-4xl font-mono-num font-medium text-[hsl(var(--terracotta-light))] mt-2">{formatCurrency(targetMaxBid)}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Estimated PPC Profit</p>
              <p className={`text-4xl font-mono-num font-medium mt-2 ${ppcProfit >= 0 ? 'text-[hsl(var(--green-light))]' : 'text-[hsl(var(--red-light))]'}`}>
                {formatCurrency(ppcProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}