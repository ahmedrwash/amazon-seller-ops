import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTableFields } from '@/utils/emailIntakeUtils';

const FieldMappingForm = ({ targetTable, fieldMappings = {}, onChange }) => {
  const availableFields = getTableFields(targetTable);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleAdd = () => {
    if (!newFieldKey) return;
    onChange({
      ...fieldMappings,
      [newFieldKey]: newFieldValue
    });
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemove = (key) => {
    const next = { ...fieldMappings };
    delete next[key];
    onChange(next);
  };

  const handleChangeValue = (key, val) => {
    onChange({
      ...fieldMappings,
      [key]: val
    });
  };

  return (
    <div className="space-y-4">
       <div className="space-y-2">
          {Object.entries(fieldMappings).map(([key, value]) => (
             <div key={key} className="flex items-center gap-2">
                <div className="w-1/3 text-sm font-medium text-slate-300 bg-slate-800 px-3 py-2 rounded border border-slate-700">
                   {key}
                </div>
                <Input 
                   value={value} 
                   onChange={(e) => handleChangeValue(key, e.target.value)}
                   className="flex-1 bg-slate-900 border-slate-700"
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemove(key)} className="text-slate-500 hover:text-red-400">
                   <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          ))}
          {Object.keys(fieldMappings).length === 0 && (
             <p className="text-sm text-slate-500 italic py-2">No fields mapped yet.</p>
          )}
       </div>

       <div className="flex items-end gap-2 pt-4 border-t border-slate-800">
          <div className="w-1/3">
             <label className="text-xs text-slate-400 mb-1 block">Target Field</label>
             <Select value={newFieldKey} onValueChange={setNewFieldKey}>
                <SelectTrigger className="bg-slate-900 border-slate-700">
                   <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                   {availableFields.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
          <div className="flex-1">
             <label className="text-xs text-slate-400 mb-1 block">Value (Text or extract)</label>
             <Input 
                value={newFieldValue} 
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder="Value..."
                className="bg-slate-900 border-slate-700"
             />
          </div>
          <Button onClick={handleAdd} disabled={!newFieldKey} variant="secondary">
             <Plus className="w-4 h-4" />
          </Button>
       </div>
    </div>
  );
};

export default FieldMappingForm;