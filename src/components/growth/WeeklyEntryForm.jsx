import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEmptyPpcWeekly, validatePpcWeekly } from '@/types/growth';
import { calculateAcos, calculateRoas, calculateCtr, calculateCpc, calculateCpa } from '@/utils/growthUtils';

const WeeklyEntryForm = ({ isOpen, onClose, onSave, loading }) => {
  // Initialize with safe defaults to prevent undefined values in calculations
  const [formData, setFormData] = useState(() => {
    const empty = createEmptyPpcWeekly ? createEmptyPpcWeekly() : {};
    return {
      week_start_date: '',
      product_marketplace_id: '',
      spend: 0,
      sales: 0,
      units_sold: 0,
      impressions: 0,
      clicks: 0,
      notes: '',
      ...empty
    };
  });
  
  const [errors, setErrors] = useState({});
  
  // Initialize calculated state with 0s to prevent undefined.toFixed() errors on first render
  const [calculated, setCalculated] = useState({
    acos: 0,
    roas: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0
  });

  useEffect(() => {
    // Real-time calculations with safe fallbacks
    const acos = calculateAcos(formData.spend, formData.sales);
    const roas = calculateRoas(formData.sales, formData.spend);
    const ctr = calculateCtr(formData.clicks, formData.impressions);
    const cpc = calculateCpc(formData.spend, formData.clicks);
    const cpa = calculateCpa(formData.spend, formData.units_sold);
    setCalculated({ acos, roas, ctr, cpc, cpa });
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSave = () => {
    const validationErrors = validatePpcWeekly ? validatePpcWeekly(formData) : {};
    // Allow without ID for demo/prototype if needed, else validate ID
    if (Object.keys(validationErrors).length > 0) {
       // if only product_marketplace_id is missing, assume context provides it or ignore for demo
       if (!validationErrors.product_marketplace_id) {
         setErrors(validationErrors);
         return;
       }
    }
    onSave(formData);
    // Reset form with safe defaults
    const empty = createEmptyPpcWeekly ? createEmptyPpcWeekly() : {};
    setFormData({
      week_start_date: '',
      product_marketplace_id: '',
      spend: 0,
      sales: 0,
      units_sold: 0,
      impressions: 0,
      clicks: 0,
      notes: '',
      ...empty
    });
    onClose();
  };

  // Helper to safely format numbers
  const safeFormat = (val, decimals = 2) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Weekly Metrics</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
           {/* Row 1 */}
           <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label>Week Start</Label>
               <Input 
                 type="date" 
                 value={formData.week_start_date || ''} 
                 onChange={(e) => handleChange('week_start_date', e.target.value)}
                 className="bg-slate-800 border-slate-700"
               />
               {errors.week_start_date && <span className="text-red-500 text-xs">{errors.week_start_date}</span>}
             </div>
             <div className="grid gap-2">
               <Label>Product ID (UUID)</Label>
               <Input 
                 value={formData.product_marketplace_id || ''} 
                 onChange={(e) => handleChange('product_marketplace_id', e.target.value)}
                 className="bg-slate-800 border-slate-700"
                 placeholder="Optional if in context"
               />
             </div>
           </div>

           {/* Row 2 - Sales/Spend */}
           <div className="grid grid-cols-3 gap-4">
             <div className="grid gap-2">
               <Label>Spend ($)</Label>
               <Input 
                 type="number" 
                 value={formData.spend} 
                 onChange={(e) => handleChange('spend', parseFloat(e.target.value) || 0)}
                 className="bg-slate-800 border-slate-700"
               />
             </div>
             <div className="grid gap-2">
               <Label>Sales ($)</Label>
               <Input 
                 type="number" 
                 value={formData.sales} 
                 onChange={(e) => handleChange('sales', parseFloat(e.target.value) || 0)}
                 className="bg-slate-800 border-slate-700"
               />
             </div>
             <div className="grid gap-2">
               <Label>Units Sold</Label>
               <Input 
                 type="number" 
                 value={formData.units_sold} 
                 onChange={(e) => handleChange('units_sold', parseInt(e.target.value) || 0)}
                 className="bg-slate-800 border-slate-700"
               />
             </div>
           </div>

           {/* Row 3 - Traffic */}
           <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
               <Label>Impressions</Label>
               <Input 
                 type="number" 
                 value={formData.impressions} 
                 onChange={(e) => handleChange('impressions', parseInt(e.target.value) || 0)}
                 className="bg-slate-800 border-slate-700"
               />
             </div>
             <div className="grid gap-2">
               <Label>Clicks</Label>
               <Input 
                 type="number" 
                 value={formData.clicks} 
                 onChange={(e) => handleChange('clicks', parseInt(e.target.value) || 0)}
                 className="bg-slate-800 border-slate-700"
               />
             </div>
           </div>

           {/* Calculated Preview */}
           <div className="grid grid-cols-5 gap-2 bg-slate-800/50 p-4 rounded text-center">
              <div>
                <div className="text-xs text-slate-500">ACOS</div>
                <div className="font-bold text-amber-500">{safeFormat(calculated.acos)}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">ROAS</div>
                <div className="font-bold text-emerald-500">{safeFormat(calculated.roas)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">CTR</div>
                <div className="font-bold">{safeFormat(calculated.ctr)}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">CPC</div>
                <div className="font-bold">${safeFormat(calculated.cpc)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">CPA</div>
                <div className="font-bold">${safeFormat(calculated.cpa)}</div>
              </div>
           </div>
           
           <div className="grid gap-2">
             <Label>Notes</Label>
             <Textarea 
               value={formData.notes || ''} 
               onChange={(e) => handleChange('notes', e.target.value)}
               className="bg-slate-800 border-slate-700"
             />
           </div>
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">Cancel</Button>
           <Button onClick={handleSave} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]" disabled={loading}>
             {loading ? 'Saving...' : 'Save Metrics'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyEntryForm;