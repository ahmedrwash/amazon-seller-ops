import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function TariffCOGSTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    factory_price_per_unit: 0,
    order_quantity: 0,
    sea_freight_total: 0,
    insurance_cost: 0,
    threpl_receiving_fee: 0,
    hts_base_duty_rate: 0,
    section_301_tariff_rate: 0,
    ieepa_tariff_rate: 0,
    customs_broker_fee: 0,
    quality_inspection_fee: 0
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        factory_price_per_unit: weeklyData.factory_price_per_unit || 0,
        order_quantity: weeklyData.order_quantity || 0,
        sea_freight_total: weeklyData.sea_freight_total || 0,
        insurance_cost: weeklyData.insurance_cost || 0,
        threpl_receiving_fee: weeklyData.threpl_receiving_fee || 0,
        hts_base_duty_rate: weeklyData.hts_base_duty_rate || 0,
        section_301_tariff_rate: weeklyData.section_301_tariff_rate || 0,
        ieepa_tariff_rate: weeklyData.ieepa_tariff_rate || 0,
        customs_broker_fee: weeklyData.customs_broker_fee || 0,
        quality_inspection_fee: weeklyData.quality_inspection_fee || 0
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('tariff_cogs_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => setData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  const handleSave = () => { onSaveWeekly('tariff', data); };

  const factoryTotal = (data.factory_price_per_unit||0) * (data.order_quantity||0);
  const cif = factoryTotal + (data.sea_freight_total||0) + (data.insurance_cost||0);
  const baseDuty = cif * ((data.hts_base_duty_rate||0) / 100);
  const sec301Duty = cif * ((data.section_301_tariff_rate||0) / 100);
  const ieepaDuty = cif * ((data.ieepa_tariff_rate||0) / 100);
  const totalDuty = baseDuty + sec301Duty + ieepaDuty;
  const totalTariffPct = (data.hts_base_duty_rate||0) + (data.section_301_tariff_rate||0) + (data.ieepa_tariff_rate||0);
  
  const totalLanded = cif + totalDuty + (data.threpl_receiving_fee||0) + (data.customs_broker_fee||0) + (data.quality_inspection_fee||0);
  const landedPerUnit = (data.order_quantity||0) > 0 ? totalLanded / data.order_quantity : 0;
  const tariffPerUnit = (data.order_quantity||0) > 0 ? totalDuty / data.order_quantity : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Import Parameters</h3>
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
            factory_price_per_unit: 'Factory Price/Unit ($)', order_quantity: 'Order Quantity', sea_freight_total: 'Sea Freight Total ($)',
            insurance_cost: 'Insurance ($)', threpl_receiving_fee: '3PL/Receiving Fee ($)', hts_base_duty_rate: 'HTS Base Duty Rate (%)',
            section_301_tariff_rate: 'Section 301 Tariff (%)', ieepa_tariff_rate: 'IEEPA Tariff (%)', customs_broker_fee: 'Customs Broker Fee ($)',
            quality_inspection_fee: 'Quality Inspection Fee ($)'
          }).map(([key, label]) => (
            <div key={key}>
              <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
              <Input type="number" name={key} value={data[key]} onChange={handleChange} className="font-mono-num mt-1 h-8" step="any" />
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[hsl(var(--terracotta))] text-white p-6 rounded-[var(--radius)] shadow-sm">
            <p className="text-sm opacity-90 mb-1">Landed Cost / Unit</p>
            <p className="text-4xl font-mono-num font-medium">{formatCurrency(landedPerUnit)}</p>
          </div>
          <div className="bg-white p-6 rounded-[var(--radius)] border border-[hsl(var(--red))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Total Tariff Rate</p>
            <p className="text-4xl font-mono-num font-medium text-[hsl(var(--red))]">{totalTariffPct}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Tariff / Unit</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(tariffPerUnit)}</p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Total Landed Amount</p>
            <p className="text-2xl font-mono-num font-medium text-[hsl(var(--cinder))]">{formatCurrency(totalLanded)}</p>
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