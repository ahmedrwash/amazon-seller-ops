import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServices } from '@/hooks/useServiceProviders';
import { PricingModel } from '@/types/serviceProviders';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ServiceForm = ({ isOpen, onClose, providerId }) => {
  const { addService } = useServices(providerId);
  const [formData, setFormData] = useState({
    service_area: '', details: '', pricing_model: 'Fixed Price', price_range: '', marketplaces: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addService(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 text-white border-slate-700">
        <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Service Area</Label>
            <Input className="bg-slate-900 border-slate-600" required
               value={formData.service_area} onChange={e => setFormData({...formData, service_area: e.target.value})} />
          </div>
          <div>
            <Label>Details</Label>
            <Input className="bg-slate-900 border-slate-600" 
               value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} />
          </div>
           <div>
            <Label>Pricing Model</Label>
            <select className="w-full h-10 px-3 rounded-md bg-slate-900 border-slate-600"
               value={formData.pricing_model} onChange={e => setFormData({...formData, pricing_model: e.target.value})}>
               {Object.values(PricingModel).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
           <div>
            <Label>Price Range</Label>
            <Input className="bg-slate-900 border-slate-600" placeholder="e.g. $500 - $1000"
               value={formData.price_range} onChange={e => setFormData({...formData, price_range: e.target.value})} />
          </div>
          <Button type="submit" className="w-full bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Save Service</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default ServiceForm;