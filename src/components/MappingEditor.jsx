import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TARGET_MODULES, MAPPING_ACTIONS, ALLOWED_TABLES, MAPPING_STATUS } from '@/constants/emailIntakeConstants';
import FieldMappingForm from '@/components/FieldMappingForm';
import { validateFieldMappings } from '@/utils/emailIntakeUtils';
import { useAuth } from '@/context/AuthContext';
import { Save, Check, Play, XCircle, AlertCircle } from 'lucide-react';

const MappingEditor = ({ email, mapping, onSave, onApprove, onApply, onReject }) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'Admin';

  const [localMapping, setLocalMapping] = useState({
    target_module: '',
    target_table: '',
    action_type: MAPPING_ACTIONS.INSERT,
    target_record_id: '',
    field_mappings: {}
  });
  
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (mapping) {
      setLocalMapping({
         target_module: mapping.target_module || '',
         target_table: mapping.target_table || '',
         action_type: mapping.action_type || MAPPING_ACTIONS.INSERT,
         target_record_id: mapping.target_record_id || '',
         field_mappings: mapping.field_mappings || {}
      });
    } else {
       // Reset if new mapping
       setLocalMapping({
          target_module: '',
          target_table: '',
          action_type: MAPPING_ACTIONS.INSERT,
          target_record_id: '',
          field_mappings: {}
       });
    }
  }, [mapping]);

  const handleChange = (field, value) => {
    setLocalMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldMapChange = (newMappings) => {
    setLocalMapping(prev => ({ ...prev, field_mappings: newMappings }));
  };

  const validate = () => {
    if (!localMapping.target_table) return ['Target table is required.'];
    const fieldErrors = validateFieldMappings(localMapping.field_mappings, localMapping.target_table);
    if (localMapping.action_type === MAPPING_ACTIONS.UPDATE && !localMapping.target_record_id) {
       fieldErrors.push('Record ID is required for UPDATE action.');
    }
    return fieldErrors;
  };

  const handleSave = () => {
     setErrors([]);
     onSave(localMapping);
  };

  const handleApprove = () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    onApprove(localMapping);
  };

  return (
    <Card className="h-full flex flex-col bg-slate-900 border-slate-800">
       <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-lg text-white">Data Mapping</CardTitle>
       </CardHeader>
       <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {errors.length > 0 && (
             <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                   <ul className="list-disc pl-4 space-y-1">
                      {errors.map((e, i) => <li key={i}>{e}</li>)}
                   </ul>
                </AlertDescription>
             </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Module</Label>
                <Select 
                   value={localMapping.target_module} 
                   onValueChange={(val) => handleChange('target_module', val)}
                >
                   <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select Module" />
                   </SelectTrigger>
                   <SelectContent>
                      {TARGET_MODULES.map(m => (
                         <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Table</Label>
                <Select 
                   value={localMapping.target_table} 
                   onValueChange={(val) => handleChange('target_table', val)}
                >
                   <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Select Table" />
                   </SelectTrigger>
                   <SelectContent>
                      {ALLOWED_TABLES.map(t => (
                         <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
          </div>

          <div className="space-y-2">
             <Label>Action</Label>
             <Select 
                value={localMapping.action_type} 
                onValueChange={(val) => handleChange('action_type', val)}
             >
                <SelectTrigger className="bg-slate-900 border-slate-700">
                   <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value={MAPPING_ACTIONS.INSERT}>Create New Record</SelectItem>
                   <SelectItem value={MAPPING_ACTIONS.UPDATE}>Update Existing Record</SelectItem>
                </SelectContent>
             </Select>
          </div>

          {localMapping.action_type === MAPPING_ACTIONS.UPDATE && (
             <div className="space-y-2">
                <Label>Target Record ID</Label>
                <Input 
                   value={localMapping.target_record_id}
                   onChange={(e) => handleChange('target_record_id', e.target.value)}
                   placeholder="UUID of record to update"
                   className="bg-slate-900 border-slate-700"
                />
             </div>
          )}

          {localMapping.target_table && (
             <div className="space-y-3 pt-4 border-t border-slate-800">
                <Label className="text-base font-semibold">Field Mappings</Label>
                <FieldMappingForm 
                   targetTable={localMapping.target_table}
                   fieldMappings={localMapping.field_mappings}
                   onChange={handleFieldMapChange}
                />
             </div>
          )}
       </CardContent>
       <CardFooter className="border-t border-slate-800 p-4 flex flex-wrap gap-2 justify-between">
           <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} className="border-slate-700">
                 <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button variant="destructive" size="sm" onClick={onReject}>
                 <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
           </div>

           <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleApprove}>
                 <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              
              {mapping?.status === MAPPING_STATUS.APPROVED && isAdmin && (
                 <Button onClick={onApply} size="sm" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                    <Play className="w-4 h-4 mr-2" /> Apply to Live
                 </Button>
              )}
           </div>
       </CardFooter>
    </Card>
  );
};

export default MappingEditor;