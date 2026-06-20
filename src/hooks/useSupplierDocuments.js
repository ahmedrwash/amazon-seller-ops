import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useSupplierDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('supplier_documents')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = async (file, documentData) => {
    setLoading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${documentData.supplier_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('supplier-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('supplier-documents')
        .getPublicUrl(filePath);

      // 3. Insert Record
      const { data, error: dbError } = await supabase
        .from('supplier_documents')
        .insert([{
          ...documentData,
          file_name: file.name,
          file_url: publicUrl
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      return data;

    } catch (err) {
      console.error('Error uploading document:', err);
      toast({
        title: 'Error',
        description: 'Failed to upload document. Ensure file is valid.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id) => {
    setLoading(true);
    try {
      // Note: We are not deleting the file from storage here to keep it simple and safe,
      // but ideally you would also remove the file from the bucket.
      const { error: err } = await supabase
        .from('supplier_documents')
        .delete()
        .eq('id', id);

      if (err) throw err;

      setDocuments(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Success',
        description: 'Document deleted',
      });
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  };
};