import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocuments } from '@/hooks/useServiceProviders';
import { DocumentType } from '@/types/serviceProviders';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DocumentUpload = ({ isOpen, onClose, providerId }) => {
  const { addDocument } = useDocuments(providerId);
  const [formData, setFormData] = useState({ doc_type: 'Contract', file_name: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real app, this would handle actual file upload to Supabase Storage.
    // For this frontend-only scope without custom backend config logic provided, we mock the URL.
    await addDocument({ 
        ...formData, 
        file_url: 'https://example.com/mock-file', 
        uploaded_at: new Date().toISOString() 
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 text-white border-slate-700">
        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <Label>Type</Label>
              <select className="w-full h-10 px-3 rounded-md bg-slate-900 border-slate-600"
                value={formData.doc_type} onChange={e => setFormData({...formData, doc_type: e.target.value})}>
                {Object.values(DocumentType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
           <div>
              <Label>File Name</Label>
              <Input className="bg-slate-900 border-slate-600" required
                value={formData.file_name} onChange={e => setFormData({...formData, file_name: e.target.value})} />
           </div>
            <div>
              <Label>Notes</Label>
              <Input className="bg-slate-900 border-slate-600"
                value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
           </div>
           <div className="p-8 border-2 border-dashed border-slate-600 rounded text-center text-slate-500">
             Drag & Drop file here or click to browse
           </div>
           <Button type="submit" className="w-full bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Upload</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default DocumentUpload;