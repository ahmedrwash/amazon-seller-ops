import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';
import { useWeeklyDataTracking } from '@/hooks/useWeeklyDataTracking';

export default function InventoryReorderTab({ weeklyData, onSaveWeekly, isSaving, selectedWeek, selectedProduct }) {
  const { loadHistory } = useWeeklyDataTracking();
  const [data, setData] = useState({
    daily_sales_velocity: 0,
    supplier_lead_time_days: 0,
    sea_freight_transit_days: 0,
    fba_checkin_buffer_days: 0,
    safety_stock_buffer_days: 0,
    units_per_order_moq: 0,
    freight_cost_per_order: 0,
    tariff_rate_percent: 0,
    current_units_at_fba: 0
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (weeklyData) {
      setData({
        daily_sales_velocity: weeklyData.daily_sales_velocity || 0,
        supplier_lead_time_days: weeklyData.supplier_lead_time_days || 0,
        sea_freight_transit_days: weeklyData.sea_freight_transit_days || 0,
        fba_checkin_buffer_days: weeklyData.fba_checkin_buffer_days || 0,
        safety_stock_buffer_days: weeklyData.safety_stock_buffer_days || 0,
        units_per_order_moq: weeklyData.units_per_order_moq || 0,
        freight_cost_per_order: weeklyData.freight_cost_per_order || 0,
        tariff_rate_percent: weeklyData.tariff_rate_percent || 0,
        current_units_at_fba: weeklyData.current_units_at_fba || 0
      });
    }
  }, [weeklyData]);

  useEffect(() => {
    if (showHistory && selectedProduct && selectedWeek) {
      loadHistory('inventory_history', selectedProduct, selectedWeek).then(setHistory);
    }
  }, [showHistory, selectedProduct, selectedWeek]);

  const handleChange = (e) => setData({ ...data, [e.target.name]: parseFloat(e.target.value) || 0 });
  
  const handleSave = () => {
    onSaveWeekly('inventory', data);
  };

  const { totalLeadDays, reorderPoint, daysRemaining, daysUntilReorder, maxStock, stockPct, orderCogs, tariffAmt, totalOrderCost, landedPerUnit } = useMemo(() => {
    const tLead = data.supplier_lead_time_days + data.sea_freight_transit_days + data.fba_checkin_buffer_days;
    const rPoint = (data.daily_sales_velocity * tLead) + (data.daily_sales_velocity * data.safety_stock_buffer_days);
    const dRem = data.daily_sales_velocity > 0 ? data.current_units_at_fba / data.daily_sales_velocity : 0;
    const dUntil = dRem - tLead - data.safety_stock_buffer_days;
    const mStock = Math.max(data.current_units_at_fba, rPoint * 1.5);
    const sPct = Math.min(100, (data.current_units_at_fba / mStock) * 100) || 0;
    
    const cogsU = weeklyData?.cogs_per_unit || 0;
    
    const oCogs = data.units_per_order_moq * cogsU;
    const tAmt = data.units_per_order_moq * (data.tariff_rate_percent / 100) * cogsU; 
    const tCost = oCogs + data.freight_cost_per_order + tAmt;
    const lUnit = data.units_per_order_moq > 0 ? tCost / data.units_per_order_moq : 0;

    return { totalLeadDays: tLead, reorderPoint: rPoint, daysRemaining: dRem, daysUntilReorder: dUntil, maxStock: mStock, stockPct: sPct, orderCogs: oCogs, tariffAmt: tAmt, totalOrderCost: tCost, landedPerUnit: lUnit };
  }, [data, weeklyData]);

  const getRiskStatus = (days) => {
    if (days < 14) return 'pill-red';
    if (days < 30) return 'pill-gold';
    return 'pill-green';
  };

  const stockColor = stockPct > 50 ? 'bg-[hsl(var(--green))]' : stockPct > 25 ? 'bg-[hsl(var(--gold))]' : 'bg-[hsl(var(--red))]';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))] space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Week {selectedWeek} Inventory</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowHistory(!showHistory)}>
                  <History className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Weekly
                </Button>
              </div>
            </div>
            <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">Current Units at FBA</Label>
            <Input type="number" name="current_units_at_fba" value={data.current_units_at_fba} onChange={handleChange} className="font-mono-num mt-1 h-8" />
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-4">
            <div className="space-y-4">
              {Object.entries({
                daily_sales_velocity: 'Daily Sales Velocity', supplier_lead_time_days: 'Supplier Lead Time (Days)',
                sea_freight_transit_days: 'Freight Transit Time (Days)', fba_checkin_buffer_days: 'FBA Check-in Buffer (Days)',
                safety_stock_buffer_days: 'Safety Stock Buffer (Days)', units_per_order_moq: 'Units per Order (MOQ)',
                freight_cost_per_order: 'Freight Cost per Order ($)', tariff_rate_percent: 'Tariff Rate (%)'
              }).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs text-[hsl(var(--cinder))] opacity-80">{label}</Label>
                  <Input type="number" name={key} value={data[key]} onChange={handleChange} className="font-mono-num mt-1 h-8" step="any" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-heading text-xl text-[hsl(var(--cinder))]">Stock Level Health</h3>
            <span className={getRiskStatus(daysUntilReorder)}>
              {daysUntilReorder < 0 ? 'Reorder Overdue' : `Reorder in ${Math.floor(daysUntilReorder)} days`}
            </span>
          </div>
          <div className="w-full bg-[hsl(var(--stone))] rounded-full h-4 mb-2 overflow-hidden">
            <div className={`h-4 rounded-full ${stockColor} transition-all duration-500`} style={{ width: `${stockPct}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-mono-num text-[hsl(var(--cinder))] opacity-70">
            <span>0</span>
            <span>Reorder Point: {formatNumber(reorderPoint)}</span>
            <span>{formatNumber(maxStock)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Days of Stock Remaining</p>
            <p className="text-3xl font-mono-num font-medium text-[hsl(var(--cinder))]">{Math.floor(daysRemaining)} <span className="text-sm opacity-50 font-body">days</span></p>
          </div>
          <div className="bg-white p-4 rounded-[var(--radius)] border border-[hsl(var(--border))] shadow-sm">
            <p className="text-sm text-[hsl(var(--cinder))] opacity-80 mb-1">Total Lead Time</p>
            <p className="text-3xl font-mono-num font-medium text-[hsl(var(--cinder))]">{totalLeadDays} <span className="text-sm opacity-50 font-body">days</span></p>
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
          <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Next Order Cost Breakdown</h3>
          <div className="space-y-3 font-mono-num text-sm">
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--cinder))] opacity-80">Order Volume</span>
              <span className="font-medium">{formatNumber(data.units_per_order_moq)} units</span>
            </div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--cinder))] opacity-80">Manufacturing COGS</span>
              <span className="font-medium">{formatCurrency(orderCogs)}</span>
            </div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--cinder))] opacity-80">Freight & Tariffs</span>
              <span className="font-medium">{formatCurrency(data.freight_cost_per_order + tariffAmt)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg">
              <span className="font-heading text-[hsl(var(--cinder))]">Total Capital Required</span>
              <span className="font-medium text-[hsl(var(--terracotta))]">{formatCurrency(totalOrderCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}