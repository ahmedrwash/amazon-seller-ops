import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Phone } from 'lucide-react';
import RatingStars from './RatingStars';
import { cn } from '@/lib/utils';

const SupplierTable = ({ suppliers, onEdit, onDelete }) => {
  if (!suppliers || suppliers.length === 0) {
     return (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg bg-slate-900/30">
          <p className="text-slate-400 mb-2">No suppliers found.</p>
          <p className="text-sm text-slate-500">Add suppliers to start tracking quotes and samples.</p>
        </div>
     );
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-300">Supplier Name</TableHead>
            <TableHead className="text-slate-300">Country</TableHead>
            <TableHead className="text-slate-300">Contact</TableHead>
            <TableHead className="text-slate-300">Rating</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id} className="border-slate-700 hover:bg-slate-800/50 group">
              <TableCell>
                <div className="flex flex-col">
                  <Link to={`/suppliers/${supplier.id}`} className="font-medium text-slate-200 hover:text-[hsl(var(--terracotta))] hover:underline">
                    {supplier.name}
                  </Link>
                  <span className="text-xs text-slate-500">{supplier.website}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-300">{supplier.country}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-300">{supplier.contact_name}</span>
                  <div className="flex gap-2 text-xs text-slate-500">
                     {supplier.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {supplier.email}</span>}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                 <RatingStars rating={supplier.rating} readonly size="sm" />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                    <DropdownMenuItem asChild>
                       <Link to={`/suppliers/${supplier.id}`} className="cursor-pointer flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> View Profile
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(supplier)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(supplier.id)} className="text-red-500 focus:text-red-400 cursor-pointer">
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

export default SupplierTable;