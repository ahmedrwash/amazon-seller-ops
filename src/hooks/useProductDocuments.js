import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useProductDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getDocuments = useCallback(async (productId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_documents')
        .select('*')
        .eq('product_id', productId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch documents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadDocument = async (productId, file, docType, notes) => {
    try {
      setLoading(true);
      
      // Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('objects') // Using default 'objects' bucket for demo, create separate bucket in real app
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get Public URL (assuming public bucket)
      const { data: { publicUrl } } = supabase.storage
        .from('objects')
        .getPublicUrl(fileName);

      // Create Record
      const { error: dbError } = await supabase
        .from('product_documents')
        .insert([{
          product_id: productId,
          doc_type: docType,
          file_url: publicUrl,
          file_name: file.name,
          notes
        }]);

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Document uploaded' });
      getDocuments(productId);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('product_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Document deleted' });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    getDocuments,
    uploadDocument,
    deleteDocument
  };
};