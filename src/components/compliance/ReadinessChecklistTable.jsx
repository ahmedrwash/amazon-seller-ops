import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '@/constants/complianceConstants';

const ReadinessChecklistTable = ({ 
  items = [], 
  onEdit, 
  onDelete, 
  onMarkComplete, 
  loading 
}) => {
  if (loading) {
    return <div className="text-center py-10 text-slate-400">Loading checklist items...</div>;
  }

  // Defensive check for items
  const safeItems = items || [];

  if (safeItems.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
        <p className="text-slate-400 mb-2">No checklist items found.</p>
        <p className="text-sm text-slate-500">Add items to track launch readiness.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-300">Category</TableHead>
            <TableHead className="text-slate-300">Item</TableHead>
            <TableHead className="text-slate-300">Product / Marketplace</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeItems.map((item) => (
            <TableRow key={item.id} className="border-slate-700 hover:bg-slate-800/50 group">
               <TableCell>
                 <Badge variant="outline" className={cn("border-0", CATEGORY_COLORS[item.category] || 'bg-slate-800 text-slate-400')}>
                   {item.category}
                 </Badge>
               </TableCell>
               <TableCell className="font-medium text-slate-200">
                  {item.item}
               </TableCell>
               <TableCell>
                 <div className="flex flex-col">
                   <span className="text-sm text-slate-300">{item.product_marketplaces?.products?.product_name}</span>
                   <span className="text-xs text-slate-500">{item.product_marketplaces?.marketplaces?.code}</span>
                 </div>
               </TableCell>
               <TableCell>
                 <span className={cn(
                   "px-2 py-0.5 rounded-full text-xs font-medium border", 
                   item.status === 'Complete' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                   item.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                   'bg-slate-500/10 text-slate-500 border-slate-500/20'
                 )}>
                    {item.status}
                 </span>
               </TableCell>
               <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                      <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMarkComplete(item)} className="cursor-pointer">
                        <Check className="mr-2 h-4 w-4" /> Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-500 focus:text-red-400 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReadinessChecklistTable;