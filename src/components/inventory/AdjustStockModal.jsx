import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOVEMENT_TYPES } from '@/constants/inventoryConstants';
import { createEmptyInventoryMovement, validateInventoryMovement } from '@/types/inventory';
import { ArrowRight } from 'lucide-react';

const AdjustStockModal = ({ isOpen, onClose, onAdjust, inventoryItem, loading }) => {
  const [formData, setFormData] = useState(createEmptyInventoryMovement(inventoryItem?.id));
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
     if (isOpen && inventoryItem) {
        setFormData(createEmptyInventoryMovement(inventoryItem.id));
        setErrors({});
     }
  }, [isOpen, inventoryItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const calculateNewStock = () => {
     const current = inventoryItem?.on_hand || 0;
     const qty = parseInt(formData.quantity) || 0;
     const type = formData.movement_type;
     
     if (type === 'Stock In' || type === 'Return' || type === 'Recount' && qty > 0) {
        return current + qty;
     } else if (type === 'Stock Out' || type === 'Damage' || type === 'Recount' && qty < 0) {
        return current - Math.abs(qty); // assuming user enters positive for stock out, or handles negative manually.
        // Let's force user to enter positive number and we handle logic.
     } else if (type === 'Adjustment') {
        return current + qty; // Adjustment can be negative
     }
     
     // Simplified Logic: 
     // Stock In, Return => Add
     // Stock Out, Damage => Subtract
     // Adjustment, Recount => Add (allow negative input)
     
     if (['Stock In', 'Return'].includes(type)) return current + Math.abs(qty);
     if (['Stock Out', 'Damage'].includes(type)) return current - Math.abs(qty);
     return current + qty; // Adjustment/Recount takes sign as is
  };

  const handleSave = () => {
    const validationErrors = validateInventoryMovement(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Normalize Quantity based on Type
    let finalQty = parseInt(formData.quantity);
    if (['Stock Out', 'Damage'].includes(formData.movement_type)) {
       finalQty = -Math.abs(finalQty);
    }
    
    onAdjust({ ...formData, quantity: finalQty });
  };

  const newStock = calculateNewStock();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
           <div className="p-3 bg-slate-800 rounded mb-2">
              <div className="text-sm text-slate-400">Current On Hand</div>
              <div className="text-2xl font-bold text-white">{inventoryItem?.on_hand || 0}</div>
           </div>

           <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select 
                 value={formData.movement_type} 
                 onValueChange={(val) => handleChange('movement_type', val)}
              >
                 <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    {MOVEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                 </SelectContent>
              </Select>
           </div>

           <div className="space-y-2">
              <Label>Quantity Change</Label>
              <Input 
                 type="number"
                 value={formData.quantity} 
                 onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
                 className="bg-slate-800 border-slate-700" 
                 placeholder="Enter quantity (use negative for reduction if Adjustment)"
              />
              {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity}</p>}
           </div>

           <div className="flex items-center gap-4 text-sm font-medium py-2">
              <span className="text-slate-400">New On Hand:</span>
              <div className="flex items-center gap-2">
                 <span>{inventoryItem?.on_hand}</span>
                 <ArrowRight className="w-4 h-4 text-slate-500" />
                 <span className={newStock < 0 ? 'text-red-500' : 'text-emerald-400'}>{newStock}</span>
              </div>
           </div>

           <div className="space-y-2">
              <Label>Reference ID (Optional)</Label>
              <Input 
                 value={formData.reference_id} 
                 onChange={(e) => handleChange('reference_id', e.target.value)}
                 className="bg-slate-800 border-slate-700" 
                 placeholder="PO #, Order #, etc."
              />
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
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Adjusting...' : 'Confirm Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustStockModal;