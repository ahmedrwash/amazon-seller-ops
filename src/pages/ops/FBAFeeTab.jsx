import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function FBAFeeTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    size_tier: 'Standard',
    unit_weight_oz: 0,
    length_inches: 0,
    width_inches: 0,
    height_inches: 0,
    referral_fee_category: 'Standard',
    monthly_units_stored: 0
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        size_tier: weeklyData.size_tier || 'Standard',
        unit_weight_oz: weeklyData.unit_weight_oz || 0,
        length_inches: weeklyData.length_inches || 0,
        width_inches: weeklyData.width_inches || 0,
        height_inches: weeklyData.height_inches || 0,
        referral_fee_category: weeklyData.referral_fee_category || 'Standard',
        monthly_units_stored: weeklyData.monthly_units_stored || 0
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('fba_fees_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setData({ ...data, [e.target.name]: val });
  };

  const handleSave = () => { onSaveWeekly('fba', data); };

  const price = weeklyData?.selling_price || 0;
  const refPct = weeklyData?.amazon_referral_fee_percent || 0;

  const cubicFeet = (data.length_inches * data.width_inches * data.height_inches) / 1728;
  const weightLbs = data.unit_weight_oz / 16;
  const dimensionalWeight = (data.length_inches * data.width_inches * data.height_inches) / 139;
  const billableWeight = Math.max(weightLbs, dimensionalWeight);

  let fbaFee = 0;
  if (data.size_tier === 'Standard') {
    if (billableWeight <= 0.25) fbaFee = 3.22;
    else if (billableWeight <= 0.5) fbaFee = 3.40;
    else if (billableWeight <= 1) fbaFee = 3.85;
    else if (billableWeight <= 2) fbaFee = 4.75;
    else fbaFee = 4.75 + Math.ceil(billableWeight - 2) * 0.56;
  } else {
    fbaFee = 9.73 + Math.ceil(billableWeight - 1) * 0.42;
  }

  const referralFee = price * (refPct / 100);
  const storageFee = cubicFeet * 0.87 * data.monthly_units_stored;
  const totalAmazonFees = fbaFee + referralFee + storageFee;
  const feePercent = price > 0 ? (totalAmazonFees / price) * 100 : 0;
  const youKeep = price - totalAmazonFees;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">FBA Parameters</h3>
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
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Size Tier</Label>
            <select name="size_tier" value={data.size_tier} onChange={handleChange} className="w-full mt-1 border border-[hsl(var(--border))] rounded-md p-2 text-sm bg-white h-8">
              <option value="Standard">Standard Size</option>
              <option value="Oversize">Oversize</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Referral Category</Label>
            <select name="referral_fee_category" value={data.referral_fee_category} onChange={handleChange} className="w-full mt-1 border border-[hsl(var(--border))] rounded-md p-2 text-sm bg-white h-8">
              <option value="Standard">Standard</option>
              <option value="Apparel">Apparel</option>
            </select>
          </div>
          {Object.entries({
            unit_weight_oz: 'Unit Weight (oz)', length_inches: 'Length (in)', width_inches: 'Width (in)', height_inches: 'Height (in)',
            monthly_units_stored: 'Average Months Stored'
          }).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
              <Input type="number" name={key} value={data[key]} onChange={handleChange} className="font-mono-num mt-1 h-8" step="any" />
            </div>
          ))}
          <div className="pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--cinder))] opacity-60">Note: Selling Price and Referral % are managed in Profit & Margin tab.</p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[hsl(var(--terracotta))] text-white p-6 rounded-[var(--radius)] shadow-sm">
            <p className="text-sm opacity-90 mb-1">Total Amazon Fees</p>
            <p className="text-4xl font-mono-num font-medium">{formatCurrency(totalAmazonFees)}</p>
            <p className="text-sm mt-2 opacity-80">Takes {formatPercent(feePercent)} of Selling Price</p>
          </div>
          <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">You Keep (Before COGS/PPC)</p>
            <p className="text-4xl font-mono-num font-medium text-[hsl(var(--green))]">{formatCurrency(youKeep)}</p>
            <p className="text-sm mt-2 text-[hsl(var(--cinder))] opacity-60">To cover product cost, freight, ads, and profit.</p>
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

        <div className="bg-white p-6 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
          <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Fee Breakdown</h3>
          <div className="space-y-3 font-mono-num text-sm">
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--cinder))] opacity-80">FBA Fulfillment Fee ({billableWeight.toFixed(2)} lbs billable)</span>
              <span className="font-medium">{formatCurrency(fbaFee)}</span>
            </div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--cinder))] opacity-80">Referral Fee ({refPct}%)</span>
              <span className="font-medium">{formatCurrency(referralFee)}</span>
            </div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--cinder))] opacity-80">Storage Fee ({cubicFeet.toFixed(3)} cu ft)</span>
              <span className="font-medium">{formatCurrency(storageFee)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}