import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UploadCloud } from 'lucide-react';
import { ASSET_TYPES } from '@/constants/listingConstants';
import { createEmptyCreativeAsset } from '@/types/listings';

const UploadAssetModal = ({ isOpen, onClose, onUpload, loading, productMarketplaceId }) => {
  const [formData, setFormData] = useState(createEmptyCreativeAsset(productMarketplaceId));
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // 10MB limit for images, 100MB for video logic here
      const isVideo = selectedFile.type.startsWith('video/');
      const limit = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (selectedFile.size > limit) {
         setError(`File too large. Max ${isVideo ? '100MB' : '10MB'}.`);
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
    onUpload(file, formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Creative Asset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Asset Type <span className="text-red-500">*</span></Label>
            <Select 
               value={formData.asset_type} 
               onValueChange={(val) => setFormData(prev => ({ ...prev, asset_type: val }))}
            >
               <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File <span className="text-red-500">*</span></Label>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:bg-slate-800/50 transition-colors relative">
               <Input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
               />
               <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-2" />
               {file ? (
                  <span className="text-[hsl(var(--terracotta))] font-medium block truncate">{file.name}</span>
               ) : (
                  <span className="text-slate-400">Click or drag to upload</span>
               )}
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleUpload} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Uploading...' : 'Upload Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadAssetModal;