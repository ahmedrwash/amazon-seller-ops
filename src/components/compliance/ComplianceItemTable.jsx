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
import { MoreHorizontal, Edit, Trash2, Check, ExternalLink } from 'lucide-react';
import { isItemOverdue } from '@/utils/complianceUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { COMPLIANCE_STATUS_COLORS } from '@/constants/complianceConstants';
import { Link } from 'react-router-dom';

const ComplianceItemTable = ({ 
  items = [], 
  onEdit, 
  onDelete, 
  onMarkComplete, 
  loading 
}) => {
  if (loading) {
    return <div className="text-center py-10 text-slate-400">Loading compliance items...</div>;
  }

  // Defensive check for items
  const safeItems = items || [];

  if (safeItems.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
        <p className="text-slate-400 mb-2">No compliance items found.</p>
        <p className="text-sm text-slate-500">Add items to track regulatory requirements.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-300">Product / Marketplace</TableHead>
            <TableHead className="text-slate-300">Requirement</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Owner</TableHead>
            <TableHead className="text-slate-300">Due Date</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeItems.map((item) => {
            const isOverdue = isItemOverdue(item.due_date) && item.status !== 'Complete' && item.status !== 'Waived' && item.status !== 'N/A';
            
            return (
              <TableRow 
                key={item.id} 
                className={cn(
                  "border-slate-700 hover:bg-slate-800/50 group",
                  isOverdue ? "bg-red-950/10 border-l-2 border-l-red-500" : ""
                )}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <Link to={`/products/${item.product_marketplaces?.products?.id}`} className="font-medium text-slate-200 hover:text-[hsl(var(--terracotta))] hover:underline">
                      {item.product_marketplaces?.products?.product_name || 'Unknown Product'}
                    </Link>
                    <span className="text-xs text-slate-500">{item.product_marketplaces?.marketplaces?.code}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-slate-300 truncate" title={item.requirement}>
                    {item.requirement}
                  </div>
                  {item.notes && <p className="text-xs text-slate-500 truncate mt-1">{item.notes}</p>}
                </TableCell>
                <TableCell>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", COMPLIANCE_STATUS_COLORS[item.status] || 'bg-slate-800 text-slate-400')}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {/* Displaying UUID directly as requested since no FK relationship exists */}
                  <span title={item.owner}>{item.owner || '-'}</span>
                </TableCell>
                <TableCell className={cn("text-sm", isOverdue ? "text-red-400 font-medium" : "text-slate-400")}>
                  {item.due_date ? format(new Date(item.due_date), 'MMM d, yyyy') : '-'}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ComplianceItemTable;