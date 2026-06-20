import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from 'lucide-react';
import UserPermissionsPanel from './UserPermissionsPanel';

export default function AdminUsersTable({ users, onUpdate }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700">
            <TableHead className="text-slate-300">User Details</TableHead>
            <TableHead className="text-slate-300">Role</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Access</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
             const accessCount = u.allowed_marketplace_ids?.length || 0;
             return (
              <TableRow key={u.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-100">{u.full_name || 'No Name'}</span>
                    <span className="text-xs text-slate-400">{u.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    u.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-slate-400">
                   {u.role === 'admin' ? 'Full System' : `${accessCount} Marketplaces`}
                </TableCell>
                <TableCell className="text-right">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Settings className="w-4 h-4 mr-2" /> Manage
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-slate-950 border-l border-slate-800 text-slate-100 w-[400px]">
                      <div className="py-6">
                        <h3 className="text-lg font-bold mb-6">User Settings</h3>
                        <UserPermissionsPanel user={u} onUpdate={onUpdate} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
             );
          })}
        </TableBody>
      </Table>
    </div>
  );
}