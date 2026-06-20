import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, History, AlertTriangle } from 'lucide-react';
import InventoryStatusBadge from './InventoryStatusBadge';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { useReorderAlerts } from '@/hooks/useReorderAlerts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

const InventoryDetailsPanel = ({ isOpen, onClose, inventoryItem, onEdit, onAdjust }) => {
  const { movements, fetchMovements } = useInventoryMovements();
  const { alerts, fetchAlerts } = useReorderAlerts(); // Ideally fetch by inventory ID if API supported
  
  React.useEffect(() => {
     if (isOpen && inventoryItem) {
        fetchMovements(inventoryItem.id);
        fetchAlerts(); // In efficient app, would filter
     }
  }, [isOpen, inventoryItem, fetchMovements, fetchAlerts]);

  // Filter alerts client side for prototype
  const itemAlerts = alerts.filter(a => a.inventory_id === inventoryItem?.id);

  if (!inventoryItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Package className="w-5 h-5 text-[hsl(var(--terracotta))]" />
             {inventoryItem.product_marketplaces?.products?.product_name || 'Inventory Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
           {/* Summary Card */}
           <div className="md:col-span-1 space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-slate-500">Status</span>
                    <InventoryStatusBadge status="In Stock" /> {/* Calculate properly */}
                 </div>
                 <div className="mb-4">
                    <div className="text-3xl font-bold text-white">{inventoryItem.on_hand}</div>
                    <div className="text-xs text-slate-400">Total On Hand</div>
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-900 p-2 rounded">
                       <div className="text-slate-500 text-xs">Reserved</div>
                       <div className="font-mono">{inventoryItem.reserved}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                       <div className="text-slate-500 text-xs">Available</div>
                       <div className="font-mono font-bold text-emerald-400">{Math.max(0, inventoryItem.on_hand - inventoryItem.reserved)}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                       <div className="text-slate-500 text-xs">Inbound</div>
                       <div className="font-mono text-blue-400">{inventoryItem.inbound}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                       <div className="text-slate-500 text-xs">Reorder Pt</div>
                       <div className="font-mono text-amber-500">{inventoryItem.reorder_point}</div>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onAdjust(inventoryItem)}>Adjust Stock</Button>
                 <Button variant="outline" className="w-full border-slate-700" onClick={() => onEdit(inventoryItem)}>Edit Details</Button>
              </div>
           </div>

           {/* Tabs: History & Alerts */}
           <div className="md:col-span-2">
              <Tabs defaultValue="history">
                 <TabsList className="bg-slate-950 border border-slate-800 w-full justify-start">
                    <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4"/> Movement History</TabsTrigger>
                    <TabsTrigger value="alerts" className="gap-2">
                       <AlertTriangle className="w-4 h-4"/> Alerts 
                       {itemAlerts.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{itemAlerts.length}</span>}
                    </TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="history" className="mt-4">
                    <div className="rounded border border-slate-800 overflow-hidden">
                       <Table>
                          <TableHeader>
                             <TableRow className="bg-slate-950 hover:bg-slate-950">
                                <TableHead className="text-slate-400 h-8">Date</TableHead>
                                <TableHead className="text-slate-400 h-8">Type</TableHead>
                                <TableHead className="text-slate-400 h-8 text-right">Change</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {movements.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-4">No movements recorded.</TableCell></TableRow>
                             ) : (
                                movements.slice(0, 10).map(m => (
                                   <TableRow key={m.id} className="border-slate-800">
                                      <TableCell className="text-xs">{format(new Date(m.created_at), 'MMM d, HH:mm')}</TableCell>
                                      <TableCell className="text-xs">{m.movement_type}</TableCell>
                                      <TableCell className={`text-xs text-right font-medium ${m.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                         {m.quantity > 0 ? '+' : ''}{m.quantity}
                                      </TableCell>
                                   </TableRow>
                                ))
                             )}
                          </TableBody>
                       </Table>
                    </div>
                 </TabsContent>

                 <TabsContent value="alerts" className="mt-4">
                    <div className="space-y-2">
                       {itemAlerts.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-sm bg-slate-950 rounded">No active alerts.</div>
                       ) : (
                          itemAlerts.map(alert => (
                             <div key={alert.id} className="flex items-center justify-between p-3 bg-red-900/10 border border-red-900/20 rounded">
                                <div>
                                   <div className="font-medium text-red-400">{alert.alert_type}</div>
                                   <div className="text-xs text-slate-400">Created: {format(new Date(alert.created_at), 'MMM d')}</div>
                                </div>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-red-800 text-red-400">View</Button>
                             </div>
                          ))
                       )}
                    </div>
                 </TabsContent>
              </Tabs>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryDetailsPanel;