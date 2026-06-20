import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useListingBriefs = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createListingBrief = async (data) => {
    setLoading(true);
    try {
      const { data: brief, error } = await supabase
        .from('listing_briefs')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Listing brief created' });
      return brief;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to create brief', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateListingBrief = async (id, data) => {
    setLoading(true);
    try {
      const { data: brief, error } = await supabase
        .from('listing_briefs')
        .update({ ...data, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Listing brief updated' });
      return brief;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update brief', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, createListingBrief, updateListingBrief };
};