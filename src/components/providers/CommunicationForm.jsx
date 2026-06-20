import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCommunications } from '@/hooks/useServiceProviders';
import { CommunicationChannel } from '@/types/serviceProviders';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CommunicationForm = ({ isOpen, onClose, providerId }) => {
  const { addCommunication } = useCommunications(providerId);
  const [formData, setFormData] = useState({
    channel: 'Email',
    subject: '',
    summary: '',
    next_action: '',
    follow_up_date: '',
    status: 'Open'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addCommunication(formData);
    onClose();
    setFormData({ channel: 'Email', subject: '', summary: '', next_action: '', follow_up_date: '', status: 'Open' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 text-white border-slate-700">
        <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Channel</Label>
              <select className="w-full h-10 px-3 rounded-md bg-slate-900 border-slate-600"
                value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})}>
                {Object.values(CommunicationChannel).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Date/Time</Label>
               <Input disabled value="Now" className="bg-slate-900 border-slate-600 opacity-50" />
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input className="bg-slate-900 border-slate-600" required
              value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea className="bg-slate-900 border-slate-600 min-h-[100px]" required
              value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Next Action</Label>
              <Input className="bg-slate-900 border-slate-600"
                value={formData.next_action} onChange={e => setFormData({...formData, next_action: e.target.value})} />
            </div>
             <div>
              <Label>Follow Up Date</Label>
              <Input type="date" className="bg-slate-900 border-slate-600"
                value={formData.follow_up_date} onChange={e => setFormData({...formData, follow_up_date: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Save Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default CommunicationForm;