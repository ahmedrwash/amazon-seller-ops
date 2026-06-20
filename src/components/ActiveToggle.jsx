import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ActiveToggle({ checked, onCheckedChange, disabled }) {
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="active-mode" 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-600"
      />
      <Label htmlFor="active-mode" className={checked ? "text-green-400" : "text-slate-400"}>
        {checked ? 'Active' : 'Disabled'}
      </Label>
    </div>
  );
}