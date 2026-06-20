import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import InventoryTable from '@/components/inventory/InventoryTable';
import InventoryModal from '@/components/inventory/InventoryModal';
import AdjustStockModal from '@/components/inventory/AdjustStockModal';
import InventoryDetailsPanel from '@/components/inventory/InventoryDetailsPanel';
import InventoryHealthIndicator from '@/components/inventory/InventoryHealthIndicator';
import { calculateInventoryHealth } from '@/utils/inventoryUtils';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { Helmet } from 'react-helmet';

const InventoryPage = () => {
  const { inventory, loading, fetchInventory, createInventory, updateInventory, deleteInventory } = useInventory();
  const { createMovement } = useInventoryMovements();
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAdjustOpen, setAdjustOpen] = useState(false);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSave = async (data) => {
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
    fetchInventory();
  };

  const health = calculateInventoryHealth(inventory);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Inventory - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Inventory & Logistics</h2>
            <div className="flex items-center gap-4 mt-2">
               <p className="text-slate-400">Manage stock across all warehouses</p>
               <InventoryHealthIndicator health={health} />
            </div>
         </div>
         <Button onClick={() => { setSelectedItem(null); setModalOpen(true); }} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            <Plus className="w-4 h-4 mr-2" /> Add Inventory
         </Button>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
         <TabsList className="bg-slate-900 border border-slate-700">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
         </TabsList>

         <TabsContent value="inventory" className="mt-6">
            {loading ? (
               <div className="text-center py-12 text-slate-400">Loading inventory...</div>
            ) : (
               <InventoryTable 
                  inventory={inventory} 
                  onEdit={(item) => { setSelectedItem(item); setModalOpen(true); }}
                  onAdjust={(item) => { setSelectedItem(item); setAdjustOpen(true); }}
                  onDelete={(id) => deleteInventory(id)}
                  onViewDetails={(item) => { setSelectedItem(item); setDetailsOpen(true); }}
               />
            )}
         </TabsContent>

         <TabsContent value="warehouses" className="mt-6">
            <div className="p-8 text-center border border-dashed border-slate-700 rounded bg-slate-900/30 text-slate-400">
               Warehouse Management Component Placeholder
            </div>
         </TabsContent>

         <TabsContent value="shipments" className="mt-6">
            <div className="p-8 text-center border border-dashed border-slate-700 rounded bg-slate-900/30 text-slate-400">
               Shipment Management Component Placeholder
            </div>
         </TabsContent>

         <TabsContent value="movements" className="mt-6">
            <div className="p-8 text-center border border-dashed border-slate-700 rounded bg-slate-900/30 text-slate-400">
               Global Movement History Placeholder
            </div>
         </TabsContent>
      </Tabs>

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

export default InventoryPage;