import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PROVIDER_STAGES } from '@/constants/providerPlaybooks';

const ProviderStageModal = ({ isOpen, onClose, currentStage, onConfirm }) => {
  const [stage, setStage] = useState(currentStage);
  const [notes, setNotes] = useState('');
  
  const handleConfirm = () => {
    onConfirm(stage, notes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Move Provider Stage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">New Stage</label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {Object.values(PROVIDER_STAGES).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Transition Notes</label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this provider moving to the next stage?"
              className="bg-slate-800 border-slate-700 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
          <Button onClick={handleConfirm} className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--terracotta))]">Confirm Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderStageModal;