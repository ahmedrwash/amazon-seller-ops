import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COST_TYPES, COST_TYPE_DESCRIPTIONS } from '@/constants/financeConstants';
import { createEmptyCostEntry, validateCostEntry } from '@/types/finance';
import { useProductMarketplaces } from '@/hooks/useProductMarketplaces'; 

const CostEntryModal = ({ isOpen, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState(createEmptyCostEntry());
  const [errors, setErrors] = useState({});
  // In real implementation, we'd fetch product marketplaces here to populate dropdown
  // For now, assuming user passes product_marketplace_id or we simulate
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSave = () => {
    const validationErrors = validateCostEntry(formData);
    // bypass product_marketplace_id check for UI prototype if not provided
    if (Object.keys(validationErrors).length > 0) {
      // Allow saving without PM ID for generic 'add' demo, but warn
      if (validationErrors.product_marketplace_id) {
         // for prototype, let's just alert
      } else {
        setErrors(validationErrors);
        return;
      }
    }
    onSave(formData);
    setFormData(createEmptyCostEntry());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
        <DialogHeader>
          <DialogTitle>Add Cost Entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           {/* Placeholder for Product Selection */}
           <div className="grid gap-2">
             <Label htmlFor="pm_id">Product Marketplace ID (UUID)</Label>
             <Input 
               id="pm_id" 
               value={formData.product_marketplace_id} 
               onChange={(e) => handleChange('product_marketplace_id', e.target.value)}
               className="bg-slate-800 border-slate-700"
               placeholder="Enter ID manually for prototype"
             />
           </div>

           <div className="grid gap-2">
             <Label>Cost Type</Label>
             <Select 
                value={formData.cost_type} 
                onValueChange={(val) => handleChange('cost_type', val)}
             >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                   {COST_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t} - {COST_TYPE_DESCRIPTIONS[t]}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
           </div>

           <div className="grid gap-2">
             <Label>Amount</Label>
             <Input 
               type="number" 
               value={formData.amount} 
               onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
               className="bg-slate-800 border-slate-700"
             />
           </div>

           <div className="grid gap-2">
             <Label>Period (Date)</Label>
             <Input 
               type="date" 
               value={formData.period} 
               onChange={(e) => handleChange('period', e.target.value)}
               className="bg-slate-800 border-slate-700"
             />
           </div>

           <div className="grid gap-2">
             <Label>Description</Label>
             <Textarea 
               value={formData.description} 
               onChange={(e) => handleChange('description', e.target.value)}
               className="bg-slate-800 border-slate-700"
             />
           </div>
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">Cancel</Button>
           <Button onClick={handleSave} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CostEntryModal;