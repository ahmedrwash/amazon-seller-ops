import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link as LinkIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

function SourceLinkImportModal({ open, onOpenChange, productId = null, onSuccess }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const detectSource = (inputUrl) => {
    try {
      if (!inputUrl) return null;
      const hostname = new URL(inputUrl).hostname;
      if (hostname.includes('amazon')) return 'Amazon';
      if (hostname.includes('alibaba')) return 'Alibaba';
      if (hostname.includes('aliexpress')) return 'AliExpress';
      if (hostname.includes('temu')) return 'Temu';
      return 'Unknown';
    } catch (e) {
      return null;
    }
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    setSource(detectSource(val));
  };

  const handleSubmit = async () => {
    if (!url) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid product URL.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare payload
      const payload = {
        source_url: url,
        product_id: productId, // Can be null or UUID
        user_id: user?.id,
        marketplace_id: null
      };

      const { data, error } = await supabase.functions.invoke('import-product-from-url', {
        body: payload
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Import Successful",
        description: productId 
          ? "Import job created successfully." 
          : "Product data extracted successfully.",
        variant: "default"
      });
      
      // Pass the full response data back to the parent
      onSuccess?.(data);
      
      // Reset and close
      onOpenChange(false);
      setUrl('');
      setSource(null);

    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: "Import Failed",
        description: err.message || "Could not import from this URL. Please check the link and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[hsl(var(--terracotta))]" />
            Import from Link
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Paste a product URL to automatically extract data.
            {productId ? " This will create an import job for the existing product." : " This will pre-fill the new product form."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Product URL</Label>
            <div className="relative">
               <Input
                 id="url"
                 placeholder="https://www.amazon.com/dp/..."
                 value={url}
                 onChange={handleUrlChange}
                 className="bg-slate-950 border-slate-800 pr-24 text-white placeholder:text-slate-500"
               />
               {source && (
                 <div className="absolute right-2 top-1.5">
                   <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                     {source}
                   </Badge>
                 </div>
               )}
            </div>
          </div>
          
          {source === 'Unknown' && url.length > 10 && (
             <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded border border-amber-900/50 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Unrecognized source. Extraction may be limited.</span>
             </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="text-slate-400 hover:text-white hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!url || loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Start Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SourceLinkImportModal;