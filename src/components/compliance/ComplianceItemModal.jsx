import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEmptyComplianceItem, validateComplianceItem } from '@/types/compliance';
import { COMPLIANCE_STATUSES } from '@/constants/complianceConstants';
import { useProductMarketplaces } from '@/hooks/useProductMarketplaces';

const ComplianceItemModal = ({ isOpen, onClose, onSave, initialItem, loading: saveLoading }) => {
  const [formData, setFormData] = useState(createEmptyComplianceItem());
  const [errors, setErrors] = useState({});
  // Fixed destructuring: use 'marketplaces' instead of 'data', and 'getProductMarketplaces' instead of 'fetchProductMarketplaces'
  const { marketplaces: productMarketplaces, loading: pmLoading, error: pmError, getProductMarketplaces } = useProductMarketplaces();

  useEffect(() => {
    if (isOpen) {
      setFormData(initialItem || createEmptyComplianceItem());
      setErrors({});
      // Call the correct function to fetch data
      if (getProductMarketplaces) {
        getProductMarketplaces();
      }
    }
  }, [isOpen, initialItem, getProductMarketplaces]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = () => {
    const validationErrors = validateComplianceItem(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  // Added defensive check (productMarketplaces || [])
  const pmOptions = (productMarketplaces || []).map(pm => ({
    value: pm.id,
    label: `${pm.products?.product_name || 'Unknown Product'} - ${pm.marketplaces?.name || 'Unknown Market'}`
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialItem ? 'Edit Compliance Item' : 'Add Compliance Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pm-select">Product - Marketplace <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.product_marketplace_id} 
              onValueChange={(val) => handleChange('product_marketplace_id', val)}
              disabled={!!initialItem || pmLoading} 
            >
              <SelectTrigger id="pm-select" className="bg-slate-800 border-slate-700">
                <SelectValue placeholder={pmLoading ? "Loading..." : "Select Product - Marketplace"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                {pmOptions.length > 0 ? (
                  pmOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-slate-400 px-8">
                     {pmLoading ? "Loading..." : "No products available"}
                  </div>
                )}
              </SelectContent>
            </Select>
            {pmError && <p className="text-red-500 text-xs">Error loading products. Please try again.</p>}
            {errors.product_marketplace_id && <p className="text-red-500 text-xs">{errors.product_marketplace_id}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirement">Requirement <span className="text-red-500">*</span></Label>
            <Input 
              id="requirement" 
              value={formData.requirement} 
              onChange={(e) => handleChange('requirement', e.target.value)} 
              placeholder="e.g. UL Certification"
              className="bg-slate-800 border-slate-700"
            />
             {errors.requirement && <p className="text-red-500 text-xs">{errors.requirement}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => handleChange('status', val)}
              >
                <SelectTrigger id="status" className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  {COMPLIANCE_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
               <Label htmlFor="due_date">Due Date</Label>
               <Input 
                 id="due_date" 
                 type="date"
                 value={formData.due_date || ''} 
                 onChange={(e) => handleChange('due_date', e.target.value)} 
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
              placeholder="Additional details..."
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={saveLoading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {saveLoading ? 'Saving...' : 'Save Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceItemModal;