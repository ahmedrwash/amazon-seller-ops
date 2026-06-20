import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings } from "lucide-react";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import UserMarketplacesModal from './UserMarketplacesModal';

export default function UserPermissionsPanel({ user, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (field, value) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({ title: "Updated", description: "User permissions updated." });
      onUpdate();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update permission.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user.role === 'Admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <div className="space-y-0.5">
           <Label className="text-base text-slate-200">User Role</Label>
           <p className="text-xs text-slate-500">System level access role</p>
         </div>
         <Badge variant="outline" className={`${isAdmin ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-slate-800 text-slate-400'}`}>
           {user.role}
         </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base text-slate-200">Active Account</Label>
          <p className="text-xs text-slate-500">Enable or disable login access</p>
        </div>
        <Switch 
          checked={user.active} 
          onCheckedChange={(val) => handleToggle('active', val)}
          disabled={loading || isAdmin} // Prevent disabling admins easily
        />
      </div>

      <div className="pt-4 border-t border-slate-800">
        <Label className="text-sm font-semibold text-slate-300 mb-3 block">Special Permissions</Label>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal text-slate-200">Manage Users</Label>
              <p className="text-[10px] text-slate-500">Can create/edit other users</p>
            </div>
            <Switch 
              checked={isAdmin || user.can_manage_users} 
              onCheckedChange={(val) => handleToggle('can_manage_users', val)}
              disabled={loading || isAdmin}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal text-slate-200">Manage Finance</Label>
              <p className="text-[10px] text-slate-500">Can view/approve financial data</p>
            </div>
            <Switch 
              checked={isAdmin || user.can_manage_finance} 
              onCheckedChange={(val) => handleToggle('can_manage_finance', val)}
              disabled={loading || isAdmin}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex justify-between items-center mb-2">
           <Label className="text-sm font-semibold text-slate-300">Marketplace Access</Label>
           <Button variant="outline" size="sm" onClick={() => setShowMarketplaceModal(true)} disabled={loading} className="h-7 text-xs">
             <Settings className="w-3 h-3 mr-1" /> Configure
           </Button>
        </div>
        <div className="bg-slate-900/50 rounded p-2 text-xs text-slate-400 min-h-[40px]">
           {isAdmin ? (
             <span className="text-purple-400 font-medium">Global Access (Admin)</span>
           ) : user.allowed_marketplace_ids?.length > 0 ? (
             <span>{user.allowed_marketplace_ids.length} marketplaces allowed</span>
           ) : (
             <span className="text-amber-500">No access granted</span>
           )}
        </div>
      </div>

      <UserMarketplacesModal 
        user={user} 
        isOpen={showMarketplaceModal} 
        onClose={() => setShowMarketplaceModal(false)}
        onSaved={onUpdate}
      />
    </div>
  );
}