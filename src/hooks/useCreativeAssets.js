import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useCreativeAssets = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadAsset = async (file, assetData) => {
    setLoading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `listing-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('objects') // Using 'objects' bucket as per existing buckets in schema, or create new bucket. Schema shows 'objects' table in storage schema but bucket usually named. Assuming 'listing-assets' bucket exists or we handle error. 
        // NOTE: Prompt says "Uploads to Supabase storage in 'listing-assets' bucket". I'll assume bucket name 'listing-assets'.
        .from('listing-assets') 
        .upload(filePath, file);

      if (uploadError) {
         // Fallback if bucket doesn't exist to notify user (in a real app we'd create it)
         if (uploadError.message.includes('bucket not found')) {
            throw new Error("Storage bucket 'listing-assets' not found. Please create it in Supabase.");
         }
         throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('listing-assets')
        .getPublicUrl(filePath);

      // 3. Insert Record
      const { data, error: dbError } = await supabase
        .from('creative_assets')
        .insert([{
          ...assetData,
          file_name: file.name,
          file_size: file.size,
          file_url: publicUrl,
          created_by: user.id
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Asset uploaded successfully' });
      return data;

    } catch (err) {
      console.error('Error uploading asset:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAsset = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creative_assets')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Asset updated' });
      return data;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update asset', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('creative_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Asset deleted' });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete asset', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, uploadAsset, updateAsset, deleteAsset };
};