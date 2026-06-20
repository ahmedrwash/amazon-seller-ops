import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function ProfitMarginTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    selling_price: 0,
    cogs_per_unit: 0,
    inbound_freight_per_unit: 0,
    import_tariff_per_unit: 0,
    amazon_referral_fee_percent: 0,
    fba_fulfillment_fee: 0,
    ppc_cost_per_unit: 0,
    storage_fee_per_unit_month: 0,
    account_management_fee_monthly: 0,
    monthly_units_sold: 0,
    other_costs_per_unit: 0
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        selling_price: weeklyData.selling_price || 0,
        cogs_per_unit: weeklyData.cogs_per_unit || 0,
        inbound_freight_per_unit: weeklyData.inbound_freight_per_unit || 0,
        import_tariff_per_unit: weeklyData.import_tariff_per_unit || 0,
        amazon_referral_fee_percent: weeklyData.amazon_referral_fee_percent || 0,
        fba_fulfillment_fee: weeklyData.fba_fulfillment_fee || 0,
        ppc_cost_per_unit: weeklyData.ppc_cost_per_unit || 0,
        storage_fee_per_unit_month: weeklyData.storage_fee_per_unit_month || 0,
        account_management_fee_monthly: weeklyData.account_management_fee_monthly || 0,
        monthly_units_sold: weeklyData.monthly_units_sold || 0,
        other_costs_per_unit: weeklyData.other_costs_per_unit || 0
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('profit_margin_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSave = () => {
    onSaveWeekly('profit', data);
  };

  const monthlyUnits = data.monthly_units_sold || 0;
  
  const { referralFee, agencyPerUnit, totalCosts, netProfit, netMargin } = useMemo(() => {
    const refFee = data.selling_price * (data.amazon_referral_fee_percent / 100);
    const agPerUnit = monthlyUnits > 0 ? data.account_management_fee_monthly / monthlyUnits : 0;
    const tCosts = data.cogs_per_unit + data.inbound_freight_per_unit + data.import_tariff_per_unit + refFee + data.fba_fulfillment_fee + data.ppc_cost_per_unit + data.storage_fee_per_unit_month + agPerUnit + data.other_costs_per_unit;
    const nProfit = data.selling_price - tCosts;
    const nMargin = data.selling_price > 0 ? (nProfit / data.selling_price) * 100 : 0;
    return { referralFee: refFee, agencyPerUnit: agPerUnit, totalCosts: tCosts, netProfit: nProfit, netMargin: nMargin };
  }, [data, monthlyUnits]);

  const getMarginStatus = (margin) => {
    if (margin >= 25) return 'pill-green';
    if (margin >= 10) return 'pill-gold';
    return 'pill-red';
  };

  const chartData = [
    { name: 'Price', start: 0, val: data.selling_price, fill: 'hsl(var(--cinder))' },
    { name: 'Fees', start: data.selling_price - (referralFee + data.fba_fulfillment_fee + data.storage_fee_per_unit_month), val: referralFee + data.fba_fulfillment_fee + data.storage_fee_per_unit_month, fill: 'hsl(var(--stone))' },
    { name: 'COGS', start: data.selling_price - (referralFee + data.fba_fulfillment_fee + data.storage_fee_per_unit_month) - (data.cogs_per_unit + data.inbound_freight_per_unit + data.import_tariff_per_unit), val: data.cogs_per_unit + data.inbound_freight_per_unit + data.import_tariff_per_unit, fill: 'hsl(var(--stone))' },
    { name: 'PPC', start: Math.max(0, data.selling_price - totalCosts + data.ppc_cost_per_unit), val: data.ppc_cost_per_unit, fill: 'hsl(var(--stone))' },
    { name: 'Profit', start: 0, val: Math.max(0, netProfit), fill: 'hsl(var(--terracotta))' }
  ];

  const scenarios = [50, 100, 200, 300, 500, 1000].map(units => {
    const agUnit = units > 0 ? data.account_management_fee_monthly / units : 0;
    const profit = data.selling_price - (data.cogs_per_unit + data.inbound_freight_per_unit + data.import_tariff_per_unit + referralFee + data.fba_fulfillment_fee + data.ppc_cost_per_unit + data.storage_fee_per_unit_month + agUnit + data.other_costs_per_unit);
    const margin = data.selling_price > 0 ? (profit / data.selling_price) * 100 : 0;
    return { units, gmv: data.selling_price * units, agUnit, profit, margin };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Week {selectedWeek} Inputs</h3>
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
              selling_price: 'Selling Price ($)', cogs_per_unit: 'COGS/Unit ($)', inbound_freight_per_unit: 'Inbound Freight/Unit ($)', import_tariff_per_unit: 'Import Tariff/Unit ($)',
              amazon_referral_fee_percent: 'Amazon Referral Fee (%)', fba_fulfillment_fee: 'FBA Fulfilment Fee ($)', ppc_cost_per_unit: 'PPC Cost/Unit ($)',
              storage_fee_per_unit_month: 'Storage Fee/Month ($)', account_management_fee_monthly: 'Agency Fee ($/mo)',
              monthly_units_sold: 'Monthly Units Sold', other_costs_per_unit: 'Other Costs/Unit ($)'
            }).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
                <Input type="number" name={key} value={data[key]} onChange={handleChange} className="font-mono-num mt-1 h-8" step="any" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--terracotta))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80">Net Profit / Unit</p>
            <p className="text-3xl font-mono-num font-medium text-[hsl(var(--terracotta))]">{formatCurrency(netProfit)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80">Net Margin</p>
            <p className="text-3xl font-mono-num font-medium mt-1">
              <span className={getMarginStatus(netMargin)}>{formatPercent(netMargin)}</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80">Total Costs</p>
            <p className="text-3xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(totalCosts)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80">Agency Cost/Unit</p>
            <p className="text-3xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(agencyPerUnit)}</p>
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

        <div className="bg-white p-6 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm overflow-x-auto">
          <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Volume Scenarios (Monthly)</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-[hsl(var(--stone-light))] text-[hsl(var(--cinder))] font-mono-num">
              <tr>
                <th className="px-4 py-3 rounded-tl-md">Units</th>
                <th className="px-4 py-3">GMV</th>
                <th className="px-4 py-3">Agency/Unit</th>
                <th className="px-4 py-3">Net Profit/Unit</th>
                <th className="px-4 py-3 rounded-tr-md">Margin & Status</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--stone-light))]/50 transition-colors">
                  <td className="px-4 py-3 font-mono-num font-medium">{formatNumber(s.units)}</td>
                  <td className="px-4 py-3 font-mono-num">{formatCurrency(s.gmv)}</td>
                  <td className="px-4 py-3 font-mono-num">{formatCurrency(s.agUnit)}</td>
                  <td className="px-4 py-3 font-mono-num">{formatCurrency(s.profit)}</td>
                  <td className="px-4 py-3">
                    <span className={getMarginStatus(s.margin)}>{formatPercent(s.margin)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}