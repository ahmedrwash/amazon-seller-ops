import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEmptyQuote, validateQuote } from '@/types/suppliers';
import { INCOTERMS, CURRENCIES } from '@/constants/supplierConstants';
import { useProducts } from '@/hooks/useProducts';

const QuoteModal = ({ isOpen, onClose, onSave, initialQuote, loading, defaultSupplierId }) => {
  const [formData, setFormData] = useState(createEmptyQuote(defaultSupplierId));
  const [errors, setErrors] = useState({});
  const { products, getProducts } = useProducts();

  useEffect(() => {
    if (isOpen) {
      setFormData(initialQuote || createEmptyQuote(defaultSupplierId));
      setErrors({});
      getProducts(); // Ensure we have products loaded
    }
  }, [isOpen, initialQuote, defaultSupplierId, getProducts]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = () => {
    const validationErrors = validateQuote(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialQuote ? 'Edit Quote' : 'Add Quote'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
             <Label htmlFor="product">Product <span className="text-red-500">*</span></Label>
             <Select 
               value={formData.product_id} 
               onValueChange={(val) => handleChange('product_id', val)}
             >
               <SelectTrigger id="product" className="bg-slate-800 border-slate-700">
                 <SelectValue placeholder="Select Product" />
               </SelectTrigger>
               <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                 {products.map(p => (
                   <SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {errors.product_id && <p className="text-red-500 text-xs">{errors.product_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="cost">Unit Cost <span className="text-red-500">*</span></Label>
               <div className="relative">
                  <Input 
                    id="cost" 
                    type="number" 
                    step="0.01"
                    value={formData.unit_cost || ''} 
                    onChange={(e) => handleChange('unit_cost', parseFloat(e.target.value))} 
                    className="bg-slate-800 border-slate-700 pl-8"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                     {formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '$'}
                  </span>
               </div>
               {errors.unit_cost && <p className="text-red-500 text-xs">{errors.unit_cost}</p>}
             </div>
             <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                   value={formData.currency} 
                   onValueChange={(val) => handleChange('currency', val)}
                >
                   <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="moq">MOQ <span className="text-red-500">*</span></Label>
               <Input 
                 id="moq" 
                 type="number"
                 value={formData.moq || ''} 
                 onChange={(e) => handleChange('moq', parseInt(e.target.value))} 
                 className="bg-slate-800 border-slate-700"
               />
               {errors.moq && <p className="text-red-500 text-xs">{errors.moq}</p>}
             </div>
             <div className="space-y-2">
               <Label htmlFor="lead">Lead Time (Days) <span className="text-red-500">*</span></Label>
               <Input 
                 id="lead" 
                 type="number"
                 value={formData.lead_time_days || ''} 
                 onChange={(e) => handleChange('lead_time_days', parseInt(e.target.value))} 
                 className="bg-slate-800 border-slate-700"
               />
               {errors.lead_time_days && <p className="text-red-500 text-xs">{errors.lead_time_days}</p>}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Incoterms</Label>
                <Select 
                   value={formData.incoterms} 
                   onValueChange={(val) => handleChange('incoterms', val)}
                >
                   <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-slate-800 border-slate-700 text-slate-200 max-h-40">
                      {INCOTERMS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label htmlFor="valid">Valid Until</Label>
                <Input 
                  id="valid" 
                  type="date"
                  value={formData.valid_until || ''} 
                  onChange={(e) => handleChange('valid_until', e.target.value)} 
                  className="bg-slate-800 border-slate-700 block"
                />
             </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="notes">Notes</Label>
             <Textarea 
               id="notes" 
               value={formData.notes || ''} 
               onChange={(e) => handleChange('notes', e.target.value)} 
               className="bg-slate-800 border-slate-700"
             />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Saving...' : 'Save Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;