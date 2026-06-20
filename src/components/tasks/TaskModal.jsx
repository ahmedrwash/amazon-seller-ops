import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_ENTITY_TYPES } from '@/constants/taskConstants';
import { createEmptyTask, validateTask } from '@/types/tasks';

const TaskModal = ({ isOpen, task, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState(createEmptyTask());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Ensure we don't have undefined values for controlled inputs
        // And ensure UUID fields are null if they are missing or empty strings
        setFormData({
          ...createEmptyTask(), // Start with defaults to ensure structure
          ...task,
          marketplace_id: task.marketplace_id || null,
          owner: task.owner || null,
          entity_id: task.entity_id || null
        });
      } else {
        setFormData(createEmptyTask());
      }
      setErrors({});
    }
  }, [isOpen, task]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateTask(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              value={formData.title || ''} 
              onChange={(e) => handleChange('title', e.target.value)} 
              className={`bg-slate-800 border-slate-700 ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <span className="text-xs text-red-500">{errors.title}</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
             <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(val) => handleChange('priority', val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="grid gap-2">
             <Label htmlFor="due_date">Due Date</Label>
             <Input 
               type="date" 
               id="due_date"
               value={formData.due_date || ''}
               onChange={(e) => handleChange('due_date', e.target.value)}
               className="bg-slate-800 border-slate-700"
             />
          </div>

          <div className="grid gap-2">
             <Label htmlFor="description">Description</Label>
             <Textarea 
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="bg-slate-800 border-slate-700"
                rows={3}
             />
          </div>
          
          {!task?.entity_id && (
             <div className="grid gap-2">
                <Label htmlFor="entity_type">Related To</Label>
                <Select value={formData.entity_type} onValueChange={(val) => handleChange('entity_type', val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {TASK_ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
              {loading ? 'Saving...' : 'Save Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;