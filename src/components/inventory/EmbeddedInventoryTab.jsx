import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import InventoryTable from './InventoryTable';
import InventoryModal from './InventoryModal';
import AdjustStockModal from './AdjustStockModal';
import InventoryDetailsPanel from './InventoryDetailsPanel';
import { useToast } from '@/components/ui/use-toast';

const EmbeddedInventoryTab = ({ entityType, entityId }) => {
  // Logic: entityType='Product', entityId=product.id
  // We need to fetch inventory ONLY for this product.
  // The general hook useInventory fetches ALL. Ideally we make a specific hook.
  // For now, let's filter client side or implement simple specific fetch here if needed.
  // Using generic hook and filtering for prototype speed.
  const { inventory, loading, fetchInventory, createInventory, updateInventory, deleteInventory } = useInventory();
  const { createMovement } = useInventoryMovements();
  
  useEffect(() => {
     fetchInventory();
  }, [fetchInventory]);

  // Client side filtering for this product
  // Note: Inventory links to product_marketplaces, which links to products.
  // Check if item.product_marketplaces.product_id == entityId OR item.product_marketplaces.products.id == entityId
  const productInventory = inventory.filter(item => 
     item.product_marketplaces?.product_id === entityId || 
     item.product_marketplaces?.products?.id === entityId
  );

  const [isModalOpen, setModalOpen] = useState(false);
  const [isAdjustOpen, setAdjustOpen] = useState(false);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { toast } = useToast();

  const handleSave = async (data) => {
     // Ensure we link to this product logic if creating new
     // Creating new inventory from here is tricky because we need a product_marketplace_id, NOT just product_id.
     // So the user must select a marketplace that is linked to this product.
     // InventoryModal handles generic creation.
     // For embedded, maybe we pre-fill?
     
     if (selectedItem) {
        await updateInventory(selectedItem.id, data);
     } else {
        await createInventory(data);
     }
     setModalOpen(false);
     setSelectedItem(null);
  };

  const submitAdjustment = async (data) => {
     await createMovement(data);
     setAdjustOpen(false);
     fetchInventory(); // refresh
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-200">Product Inventory</h3>
          <Button onClick={() => { setSelectedItem(null); setModalOpen(true); }} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
             <Plus className="w-4 h-4 mr-2" /> Add Inventory
          </Button>
       </div>

       {loading ? (
          <div className="text-center py-8 text-slate-400">Loading inventory...</div>
       ) : (
          <InventoryTable 
             inventory={productInventory}
             onEdit={(item) => { setSelectedItem(item); setModalOpen(true); }}
             onAdjust={(item) => { setSelectedItem(item); setAdjustOpen(true); }}
             onDelete={(id) => deleteInventory(id)}
             onViewDetails={(item) => { setSelectedItem(item); setDetailsOpen(true); }}
          />
       )}

       <InventoryModal 
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initialInventory={selectedItem}
          loading={loading}
       />
       
       <AdjustStockModal 
          isOpen={isAdjustOpen}
          onClose={() => setAdjustOpen(false)}
          onAdjust={submitAdjustment}
          inventoryItem={selectedItem}
       />

       <InventoryDetailsPanel 
          isOpen={isDetailsOpen}
          onClose={() => setDetailsOpen(false)}
          inventoryItem={selectedItem}
          onEdit={(item) => { setDetailsOpen(false); setSelectedItem(item); setModalOpen(true); }}
          onAdjust={(item) => { setDetailsOpen(false); setSelectedItem(item); setAdjustOpen(true); }}
       />
    </div>
  );
};

export default EmbeddedInventoryTab;