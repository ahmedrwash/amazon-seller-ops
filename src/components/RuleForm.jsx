import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TARGET_MODULES, ALLOWED_TABLES, MAPPING_ACTIONS } from '@/constants/emailIntakeConstants';

const RuleForm = ({ rule, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    enabled: rule?.enabled ?? true,
    priority: rule?.priority || 10,
    subject_contains: rule?.match_conditions?.subject_contains?.join(', ') || '',
    from_contains: rule?.match_conditions?.from_contains?.join(', ') || '',
    target_module: rule?.default_target?.module || '',
    target_table: rule?.default_target?.table || '',
    target_action: rule?.default_target?.action || MAPPING_ACTIONS.INSERT,
  });

  const handleSubmit = () => {
    const payload = {
       name: formData.name,
       enabled: formData.enabled,
       priority: parseInt(formData.priority, 10),
       match_conditions: {
          subject_contains: formData.subject_contains.split(',').map(s => s.trim()).filter(Boolean),
          from_contains: formData.from_contains.split(',').map(s => s.trim()).filter(Boolean)
       },
       default_target: {
          module: formData.target_module,
          table: formData.target_table,
          action: formData.target_action
       }
    };
    onSave(payload);
  };

  return (
    <div className="space-y-4 py-4">
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label>Rule Name</Label>
             <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Supplier Invoices"
             />
          </div>
          <div className="space-y-2">
             <Label>Priority (Higher runs first)</Label>
             <Input 
                type="number" 
                value={formData.priority} 
                onChange={e => setFormData({...formData, priority: e.target.value})} 
             />
          </div>
       </div>

       <div className="flex items-center space-x-2">
          <Switch 
             id="enabled" 
             checked={formData.enabled} 
             onCheckedChange={c => setFormData({...formData, enabled: c})} 
          />
          <Label htmlFor="enabled">Rule Enabled</Label>
       </div>

       <div className="space-y-3 pt-2 border-t border-slate-700">
          <h4 className="text-sm font-semibold">Match Conditions</h4>
          <div className="space-y-2">
             <Label>Subject Contains (comma separated)</Label>
             <Input 
                value={formData.subject_contains} 
                onChange={e => setFormData({...formData, subject_contains: e.target.value})} 
                placeholder="invoice, bill, receipt"
             />
          </div>
          <div className="space-y-2">
             <Label>From Address Contains (comma separated)</Label>
             <Input 
                value={formData.from_contains} 
                onChange={e => setFormData({...formData, from_contains: e.target.value})} 
                placeholder="@supplier.com, info@"
             />
          </div>
       </div>

       <div className="space-y-3 pt-2 border-t border-slate-700">
          <h4 className="text-sm font-semibold">Default Actions</h4>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Module</Label>
                <Select 
                   value={formData.target_module} 
                   onValueChange={v => setFormData({...formData, target_module: v})}
                >
                   <SelectTrigger><SelectValue placeholder="Module"/></SelectTrigger>
                   <SelectContent>
                      {TARGET_MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                 <Label>Table</Label>
                 <Select 
                   value={formData.target_table} 
                   onValueChange={v => setFormData({...formData, target_table: v})}
                >
                   <SelectTrigger><SelectValue placeholder="Table"/></SelectTrigger>
                   <SelectContent>
                      {ALLOWED_TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
          </div>
       </div>

       <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.name}>Save Rule</Button>
       </DialogFooter>
    </div>
  );
};

export default RuleForm;