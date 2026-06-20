import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RatingStars from './RatingStars';
import { createEmptySupplier, validateSupplier } from '@/types/suppliers';

// Simple country list for dropdown - could be moved to constants or use a library
const COMMON_COUNTRIES = [
  "China", "United States", "India", "Vietnam", "Turkey", "Pakistan", "Thailand", 
  "Germany", "United Kingdom", "Japan", "South Korea", "Taiwan", "Bangladesh", "Mexico"
];

const SupplierModal = ({ isOpen, onClose, onSave, initialSupplier, loading }) => {
  const [formData, setFormData] = useState(createEmptySupplier());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialSupplier || createEmptySupplier());
      setErrors({});
    }
  }, [isOpen, initialSupplier]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = () => {
    const validationErrors = validateSupplier(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="name">Supplier Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleChange('name', e.target.value)} 
              className="bg-slate-800 border-slate-700"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
               value={formData.country} 
               onValueChange={(val) => handleChange('country', val)}
            >
               <SelectTrigger id="country" className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select Country" />
               </SelectTrigger>
               <SelectContent className="bg-slate-800 border-slate-700 text-slate-200 max-h-60">
                  {COMMON_COUNTRIES.map(c => (
                     <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              value={formData.website || ''} 
              onChange={(e) => handleChange('website', e.target.value)} 
              className="bg-slate-800 border-slate-700"
              placeholder="https://"
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="contact">Contact Name</Label>
             <Input 
               id="contact" 
               value={formData.contact_name || ''} 
               onChange={(e) => handleChange('contact_name', e.target.value)} 
               className="bg-slate-800 border-slate-700"
             />
          </div>

          <div className="space-y-2">
             <Label htmlFor="email">Email</Label>
             <Input 
               id="email" 
               type="email"
               value={formData.email || ''} 
               onChange={(e) => handleChange('email', e.target.value)} 
               className="bg-slate-800 border-slate-700"
             />
             {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          <div className="space-y-2">
             <Label htmlFor="phone">Phone</Label>
             <Input 
               id="phone" 
               value={formData.phone || ''} 
               onChange={(e) => handleChange('phone', e.target.value)} 
               className="bg-slate-800 border-slate-700"
             />
          </div>

           <div className="space-y-2">
             <Label>Rating</Label>
             <div className="pt-2">
                <RatingStars 
                   rating={formData.rating || 0} 
                   onRate={(r) => handleChange('rating', r)} 
                   size="lg"
                />
             </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={formData.notes || ''} 
              onChange={(e) => handleChange('notes', e.target.value)} 
              className="bg-slate-800 border-slate-700 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Saving...' : 'Save Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierModal;