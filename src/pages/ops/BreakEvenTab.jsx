import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function BreakEvenTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    inventory_cost: 0,
    freight_customs_cost: 0,
    krolog_phase1_fee: 0,
    krolog_phase2_monthly: 0,
    photography_cost: 0,
    packaging_design_cost: 0,
    trademark_filing_cost: 0,
    amazon_seller_account_annual: 0,
    ppc_launch_budget: 0,
    other_setup_costs: 0
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        inventory_cost: weeklyData.inventory_cost || 0,
        freight_customs_cost: weeklyData.freight_customs_cost || 0,
        krolog_phase1_fee: weeklyData.krolog_phase1_fee || 0,
        krolog_phase2_monthly: weeklyData.krolog_phase2_monthly || 0,
        photography_cost: weeklyData.photography_cost || 0,
        packaging_design_cost: weeklyData.packaging_design_cost || 0,
        trademark_filing_cost: weeklyData.trademark_filing_cost || 0,
        amazon_seller_account_annual: weeklyData.amazon_seller_account_annual || 0,
        ppc_launch_budget: weeklyData.ppc_launch_budget || 0,
        other_setup_costs: weeklyData.other_setup_costs || 0
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('breakeven_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => setData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  
  const handleSave = () => { onSaveWeekly('breakeven', data); };

  const totalFixed = (data.inventory_cost||0) + (data.freight_customs_cost||0) + (data.krolog_phase1_fee||0) + (data.krolog_phase2_monthly||0) + (data.photography_cost||0) + (data.packaging_design_cost||0) + (data.trademark_filing_cost||0) + (data.amazon_seller_account_annual||0) + (data.ppc_launch_budget||0) + (data.other_setup_costs||0);
  
  const price = weeklyData?.selling_price || 0;
  const varCost = (weeklyData?.cogs_per_unit||0) + (weeklyData?.inbound_freight_per_unit||0) + (weeklyData?.import_tariff_per_unit||0) + (weeklyData?.fba_fulfillment_fee||0) + (price * ((weeklyData?.amazon_referral_fee_percent||0)/100));
  
  const contributionMargin = price - varCost;
  const breakEvenUnits = contributionMargin > 0 ? totalFixed / contributionMargin : 0;
  const breakEvenGmv = breakEvenUnits * price;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Fixed Costs</h3>
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
            inventory_cost: 'Initial Inventory Cost ($)', freight_customs_cost: 'Freight & Customs ($)', krolog_phase1_fee: 'Agency Launch Fee ($)',
            krolog_phase2_monthly: 'Agency Mgmt Fee - Upfront ($)', photography_cost: 'Photography ($)', packaging_design_cost: 'Packaging Design ($)',
            trademark_filing_cost: 'Trademark Filing ($)', amazon_seller_account_annual: 'Amazon Seller Account ($)', ppc_launch_budget: 'PPC Launch Budget ($)',
            other_setup_costs: 'Other Setup Costs ($)'
          }).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
              <Input type="number" name={key} value={data[key]} onChange={handleChange} className="font-mono-num mt-1 h-8" step="any" />
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[hsl(var(--terracotta))] text-white p-6 rounded-[var(--radius)] shadow-sm">
            <p className="text-sm opacity-90 mb-1">Break-Even Units</p>
            <p className="text-4xl font-mono-num font-medium">{formatNumber(Math.ceil(breakEvenUnits))}</p>
            <p className="text-sm mt-2 opacity-80">Units needed to sell to recover all fixed costs.</p>
          </div>
          <div className="bg-[hsl(var(--cinder))] text-white p-6 rounded-[var(--radius)] shadow-sm">
            <p className="text-sm opacity-90 mb-1">Break-Even GMV</p>
            <p className="text-4xl font-mono-num font-medium text-[hsl(var(--parchment))]">{formatCurrency(breakEvenGmv)}</p>
            <p className="text-sm mt-2 opacity-80">Total revenue required to break even.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Total Fixed Costs</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(totalFixed)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Contribution / Unit</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--green))]">{formatCurrency(contributionMargin)}</p>
            <p className="text-xs mt-1 text-muted-foreground">Price - (COGS + FBA + Ref Fee)</p>
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
      </div>
    </div>
  );
}