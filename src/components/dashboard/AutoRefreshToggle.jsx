import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const AutoRefreshToggle = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center space-x-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
      <Switch 
        id="auto-refresh" 
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-[hsl(var(--terracotta))]"
      />
      <Label htmlFor="auto-refresh" className="text-sm text-slate-300 cursor-pointer select-none">
        Auto-refresh
        {enabled && <span className="text-xs text-slate-500 ml-1">(5m)</span>}
      </Label>
    </div>
  );
};

export default AutoRefreshToggle;