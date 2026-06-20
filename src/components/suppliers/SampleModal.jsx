import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEmptySample, validateSample } from '@/types/suppliers';
import { SAMPLE_STATUSES } from '@/constants/supplierConstants';
import { useProducts } from '@/hooks/useProducts';

const SampleModal = ({ isOpen, onClose, onSave, initialSample, loading, defaultSupplierId }) => {
  const [formData, setFormData] = useState(createEmptySample(defaultSupplierId));
  const [errors, setErrors] = useState({});
  const { products, getProducts } = useProducts();

  useEffect(() => {
    if (isOpen) {
      setFormData(initialSample || createEmptySample(defaultSupplierId));
      setErrors({});
      getProducts();
    }
  }, [isOpen, initialSample, defaultSupplierId, getProducts]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = () => {
    const validationErrors = validateSample(formData);
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
          <DialogTitle>{initialSample ? 'Edit Sample' : 'Request Sample'}</DialogTitle>
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
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="date" 
                  type="date"
                  value={formData.sample_date || ''} 
                  onChange={(e) => handleChange('sample_date', e.target.value)} 
                  className="bg-slate-800 border-slate-700 block"
                />
                 {errors.sample_date && <p className="text-red-500 text-xs">{errors.sample_date}</p>}
             </div>
             <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                   value={formData.status} 
                   onValueChange={(val) => handleChange('status', val)}
                >
                   <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                      {SAMPLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="feedback">Feedback</Label>
             <Textarea 
               id="feedback" 
               value={formData.feedback || ''} 
               onChange={(e) => handleChange('feedback', e.target.value)} 
               className="bg-slate-800 border-slate-700"
               placeholder="Quality notes, issues..."
             />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Saving...' : 'Save Sample'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SampleModal;