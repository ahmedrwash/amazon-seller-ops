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
import { Edit, Trash2, Power } from 'lucide-react';

const MarketplaceTable = ({ 
  marketplaces, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  isAdmin 
}) => {
  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading marketplaces...</div>;
  }

  if (marketplaces.length === 0) {
    return <div className="text-center py-8 text-slate-400">No marketplaces found.</div>;
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50">
      <Table>
        <TableHeader className="[&_tr]:border-b [&_tr]:border-slate-700">
          <TableRow className="border-b border-slate-700 transition-colors hover:bg-slate-900/50 data-[state=selected]:bg-slate-900">
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">Code</TableHead>
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">Name</TableHead>
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">Region</TableHead>
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">Currency</TableHead>
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">Language</TableHead>
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">VAT</TableHead>
            <TableHead className="h-12 px-4 align-middle font-medium text-slate-200">Status</TableHead>
            {isAdmin && <TableHead className="h-12 px-4 align-middle font-medium text-slate-200 text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-0">
          {marketplaces.map((m) => (
            <TableRow key={m.id} className="border-b border-slate-700 transition-colors hover:bg-slate-800/50">
              <TableCell className="p-4 font-medium text-[hsl(var(--terracotta))]">{m.code}</TableCell>
              <TableCell className="p-4">{m.name}</TableCell>
              <TableCell className="p-4 text-slate-400">{m.region}</TableCell>
              <TableCell className="p-4 text-slate-400">{m.currency}</TableCell>
              <TableCell className="p-4 text-slate-400">{m.default_language?.toUpperCase() || '-'}</TableCell>
              <TableCell className="p-4">
                 {m.vat_required ? (
                   <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
                     Required
                   </Badge>
                 ) : (
                   <span className="text-slate-500 text-xs">No</span>
                 )}
              </TableCell>
              <TableCell className="p-4">
                {m.active ? (
                  <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-500">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(m)}
                      className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActive(m.id, m.active)}
                      className={`h-8 w-8 ${m.active ? 'text-amber-500 hover:text-amber-400' : 'text-green-500 hover:text-green-400'} hover:bg-slate-800`}
                      title={m.active ? "Deactivate" : "Activate"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(m.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MarketplaceTable;