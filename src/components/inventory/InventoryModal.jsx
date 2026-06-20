import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEmptyInventory, validateInventory } from '@/types/inventory';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProductMarketplaces } from '@/hooks/useProductMarketplaces';

const InventoryModal = ({ isOpen, onClose, onSave, initialInventory, loading }) => {
  const [formData, setFormData] = useState(createEmptyInventory());
  const [errors, setErrors] = useState({});
  const { warehouses, fetchWarehouses } = useWarehouses();
  // We need all product marketplaces to let user select
  // Simplified hook usage: assuming useProductMarketplaces can fetch all or we'd need a specific hook.
  // For now let's use a hypothetical getAllProductMarketplaces or assume passed as props or just standard hook.
  // Standard hook usually fetches by product ID. Let's assume we pass products list or fetch logic here.
  // To keep it simple and robust, let's assume we are adding inventory from a context where we might know the product, 
  // OR we need to fetch all PMs. Let's just fetch all warehouses and a list of PMs.
  // Since fetching ALL products might be heavy, typically this is done from Product Page (where PM ID is known) 
  // or we need an async select. 
  // FOR PROTOTYPE: I'll assume we can pass `productMarketplaces` as prop if available, or just render a simple input for ID if not.
  // Better: Let's rely on parent passing valid options or simplified dropdown.
  
  useEffect(() => {
    if (isOpen) {
      setFormData(initialInventory || createEmptyInventory());
      setErrors({});
      fetchWarehouses();
    }
  }, [isOpen, initialInventory, fetchWarehouses]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSave = () => {
    const validationErrors = validateInventory(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  const available = Math.max(0, (parseInt(formData.on_hand) || 0) - (parseInt(formData.reserved) || 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialInventory ? 'Edit Inventory' : 'Add Inventory'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
           {/* If editing, show read-only product/warehouse info usually, or allow changing if new */}
           {!initialInventory && (
              <div className="space-y-2">
                 <Label>Product Marketplace ID (UUID)</Label>
                 <Input 
                    value={formData.product_marketplace_id} 
                    onChange={(e) => handleChange('product_marketplace_id', e.target.value)}
                    className="bg-slate-800 border-slate-700" 
                    placeholder="Enter Product Marketplace ID"
                 />
                 {errors.product_marketplace_id && <p className="text-red-500 text-xs">{errors.product_marketplace_id}</p>}
              </div>
           )}

           <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select 
                 value={formData.warehouse_id} 
                 onValueChange={(val) => handleChange('warehouse_id', val)}
                 disabled={!!initialInventory}
              >
                 <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select Warehouse" />
                 </SelectTrigger>
                 <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                 </SelectContent>
              </Select>
              {errors.warehouse_id && <p className="text-red-500 text-xs">{errors.warehouse_id}</p>}
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>On Hand <span className="text-red-500">*</span></Label>
                 <Input 
                    type="number"
                    value={formData.on_hand} 
                    onChange={(e) => handleChange('on_hand', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-700" 
                 />
                 {errors.on_hand && <p className="text-red-500 text-xs">{errors.on_hand}</p>}
              </div>
              <div className="space-y-2">
                 <Label>Reserved</Label>
                 <Input 
                    type="number"
                    value={formData.reserved} 
                    onChange={(e) => handleChange('reserved', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-700" 
                 />
              </div>
           </div>

           <div className="p-2 bg-slate-800/50 rounded text-center text-sm">
              <span className="text-slate-400">Calculated Available: </span>
              <span className="font-bold text-emerald-400">{available}</span>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Reorder Point</Label>
                 <Input 
                    type="number"
                    value={formData.reorder_point} 
                    onChange={(e) => handleChange('reorder_point', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-700" 
                 />
              </div>
              <div className="space-y-2">
                 <Label>Reorder Quantity</Label>
                 <Input 
                    type="number"
                    value={formData.reorder_quantity} 
                    onChange={(e) => handleChange('reorder_quantity', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-700" 
                 />
              </div>
           </div>

           <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                 value={formData.notes || ''} 
                 onChange={(e) => handleChange('notes', e.target.value)}
                 className="bg-slate-800 border-slate-700" 
              />
           </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Saving...' : 'Save Inventory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryModal;