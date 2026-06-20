import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, RefreshCw, Trash2, Eye } from 'lucide-react';
import InventoryStatusBadge from './InventoryStatusBadge';
import { calculateAvailable, calculateInventoryStatus } from '@/utils/inventoryUtils';

const InventoryTable = ({ inventory, onEdit, onAdjust, onDelete, onViewDetails }) => {
  if (!inventory || inventory.length === 0) {
    return <div className="text-center py-12 text-slate-500">No inventory found.</div>;
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-300">Product</TableHead>
            <TableHead className="text-slate-300">Marketplace</TableHead>
            <TableHead className="text-slate-300">Warehouse</TableHead>
            <TableHead className="text-right text-slate-300">On Hand</TableHead>
            <TableHead className="text-right text-slate-300">Inbound</TableHead>
            <TableHead className="text-right text-slate-300">Reserved</TableHead>
            <TableHead className="text-right text-slate-300">Available</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const available = calculateAvailable(item.on_hand, item.reserved);
            const status = calculateInventoryStatus(item.on_hand, item.reserved, item.reorder_point);
            const isLowOrOut = status === 'Low Stock' || status === 'Out of Stock';

            return (
              <TableRow key={item.id} className={`border-slate-700 hover:bg-slate-800/50 ${isLowOrOut ? 'bg-red-900/5' : ''}`}>
                <TableCell className="font-medium text-slate-200">
                  {item.product_marketplaces?.products?.product_name || 'Unknown Product'}
                </TableCell>
                <TableCell>{item.product_marketplaces?.marketplaces?.code}</TableCell>
                <TableCell>{item.warehouses?.name}</TableCell>
                <TableCell className="text-right">{item.on_hand}</TableCell>
                <TableCell className="text-right text-blue-400">{item.inbound > 0 ? item.inbound : '-'}</TableCell>
                <TableCell className="text-right text-slate-500">{item.reserved}</TableCell>
                <TableCell className="text-right font-bold text-slate-200">{available}</TableCell>
                <TableCell><InventoryStatusBadge status={status} /></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                      <DropdownMenuItem onClick={() => onViewDetails(item)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAdjust(item)} className="cursor-pointer">
                        <RefreshCw className="mr-2 h-4 w-4" /> Adjust Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-500 focus:text-red-400 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryTable;