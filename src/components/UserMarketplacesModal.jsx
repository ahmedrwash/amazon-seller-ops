import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle } from "lucide-react";
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export default function UserMarketplacesModal({ user, isOpen, onClose, onSaved }) {
  const { marketplaces, loading: loadingMarketplaces } = useMarketplaces();
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      // Load current permissions
      setSelectedIds(user.allowed_marketplace_ids || []);
    }
  }, [isOpen, user]);

  const handleToggle = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === marketplaces.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(marketplaces.map(m => m.id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ allowed_marketplace_ids: selectedIds })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Sync user_marketplaces table (Deleting old, inserting new)
      // This is a naive approach, better to do upsert or specific delete/add, but sufficient for admin tool
      await supabase.from('user_marketplaces').delete().eq('user_id', user.id);
      
      if (selectedIds.length > 0) {
        const rows = selectedIds.map(mid => ({
          user_id: user.id,
          marketplace_id: mid,
          created_by: user.id // Self assigned in this context, or admin's ID if we had it handy
        }));
        await supabase.from('user_marketplaces').insert(rows);
      }

      toast({ title: "Success", description: "Marketplace access updated." });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update access.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle>Marketplace Access</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select which marketplaces {user.full_name} can access.
          </DialogDescription>
        </DialogHeader>

        {loadingMarketplaces ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[hsl(var(--terracotta))]" /></div>
        ) : (
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
               <Label className="text-xs text-slate-500 uppercase font-bold">Available Marketplaces</Label>
               <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs h-6">
                 {selectedIds.length === marketplaces.length ? 'Deselect All' : 'Select All'}
               </Button>
            </div>
            
            <ScrollArea className="h-[300px] border border-slate-700 rounded-md p-4">
               <div className="space-y-3">
                 {marketplaces.map(mp => (
                   <div key={mp.id} className="flex items-center space-x-2">
                     <Checkbox 
                       id={`mp-${mp.id}`} 
                       checked={selectedIds.includes(mp.id)}
                       onCheckedChange={() => handleToggle(mp.id)}
                       className="border-slate-500 data-[state=checked]:bg-[hsl(var(--terracotta))] data-[state=checked]:border-[hsl(var(--terracotta))]"
                     />
                     <Label htmlFor={`mp-${mp.id}`} className="flex-1 cursor-pointer text-sm">
                       {mp.code} - {mp.name}
                     </Label>
                   </div>
                 ))}
               </div>
            </ScrollArea>
            
            {selectedIds.length === 0 && (
              <div className="mt-4 flex items-center gap-2 text-amber-500 text-sm bg-amber-950/30 p-3 rounded border border-amber-900/50">
                <AlertTriangle className="w-4 h-4" />
                <span>Warning: User will lose access to all data.</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}