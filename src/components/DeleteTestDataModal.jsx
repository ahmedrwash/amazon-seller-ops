import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteTestDataModal({ isOpen, onClose, onConfirm, isDeleting }) {
  return (
    <Dialog open={isOpen} onOpenChange={isDeleting ? undefined : onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-slate-400 mt-2">
            This will permanently delete all data tagged with the marker <code className="bg-slate-900 px-1 rounded text-xs text-red-300">TEST_SEED_10_202601</code>.
            <br/><br/>
            <strong>Affected Tables:</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded border border-slate-800 font-mono">
          provider_communications, provider_services, service_providers, ppc_weekly, pnl_monthly, cost_entries, inventory, warehouses, compliance_items, tasks, supplier_quotes, suppliers, product_marketplaces, products
        </div>

        <div className="p-3 mt-2 bg-amber-900/10 border border-amber-900/30 rounded text-amber-500 text-xs">
          Warning: Marketplaces will NOT be deleted. This action cannot be undone.
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isDeleting}
            className="bg-red-900 hover:bg-red-800 text-red-100"
          >
            {isDeleting ? "Deleting..." : "Delete All Test Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}