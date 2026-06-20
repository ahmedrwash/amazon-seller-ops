import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from 'lucide-react';
import { DOCUMENT_TYPES } from '@/constants/supplierConstants';
import { createEmptyDocument } from '@/types/suppliers';

const DocumentUploadModal = ({ isOpen, onClose, onUpload, loading, defaultSupplierId }) => {
  const [formData, setFormData] = useState(createEmptyDocument(defaultSupplierId));
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!formData.doc_type) {
        setError('Please select a document type');
        return;
    }
    onUpload(file, formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
             <Label htmlFor="type">Document Type <span className="text-red-500">*</span></Label>
             <Select 
               value={formData.doc_type} 
               onValueChange={(val) => setFormData(prev => ({ ...prev, doc_type: val }))}
             >
               <SelectTrigger id="type" className="bg-slate-800 border-slate-700">
                 <SelectValue placeholder="Select Type" />
               </SelectTrigger>
               <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                 {DOCUMENT_TYPES.map(t => (
                   <SelectItem key={t} value={t}>{t}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
            <Label>File Upload <span className="text-red-500">*</span></Label>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:bg-slate-800/50 transition-colors">
              <Input 
                 type="file" 
                 id="file-upload" 
                 className="hidden" 
                 onChange={handleFileChange}
                 accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                 <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                 {file ? (
                   <span className="text-[hsl(var(--terracotta))] font-medium">{file.name}</span>
                 ) : (
                   <span className="text-slate-400">Click to upload or drag and drop</span>
                 )}
                 <span className="text-xs text-slate-600 mt-1">Max 10MB (PDF, DOC, XLS, Images)</span>
              </label>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>

          <div className="space-y-2">
             <Label htmlFor="notes">Notes</Label>
             <Textarea 
               id="notes" 
               value={formData.notes || ''} 
               onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
               className="bg-slate-800 border-slate-700"
             />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleUpload} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;