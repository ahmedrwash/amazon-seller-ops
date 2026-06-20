import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useMarketplaces = () => {
  const [marketplaces, setMarketplaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchMarketplaces = useCallback(async (filters = {}) => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('marketplaces')
        .select('*')
        .order('code', { ascending: true })
        .order('name', { ascending: true });

      if (filters.search) {
        query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }
      if (filters.region && filters.region !== 'all') {
        query = query.eq('region', filters.region);
      }
      if (filters.active !== undefined && filters.active !== 'all') {
        // Handle boolean or string 'true'/'false'
        const isActive = filters.active === true || filters.active === 'true';
        query = query.eq('active', isActive);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setMarketplaces(data || []);
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching marketplaces:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to fetch marketplaces.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  const createMarketplace = async (data) => {
    try {
      const { error } = await supabase
        .from('marketplaces')
        .insert([{ ...data, created_by: session.user.id }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Marketplace created successfully.',
      });
      fetchMarketplaces();
      return { error: null };
    } catch (err) {
      console.error('Error creating marketplace:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err };
    }
  };

  const updateMarketplace = async (id, data) => {
    try {
      const { error } = await supabase
        .from('marketplaces')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Marketplace updated successfully.',
      });
      fetchMarketplaces();
      return { error: null };
    } catch (err) {
      console.error('Error updating marketplace:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err };
    }
  };

  const deleteMarketplace = async (id) => {
    try {
      const { error } = await supabase
        .from('marketplaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Marketplace deleted successfully.',
      });
      fetchMarketplaces();
      return { error: null };
    } catch (err) {
      console.error('Error deleting marketplace:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err };
    }
  };

  const toggleActive = async (id, currentStatus) => {
    return updateMarketplace(id, { active: !currentStatus });
  };

  useEffect(() => {
    fetchMarketplaces();
  }, [fetchMarketplaces]);

  return {
    marketplaces,
    data: marketplaces, // Alias for compatibility with new requirement
    loading,
    error,
    fetchMarketplaces,
    createMarketplace,
    updateMarketplace,
    deleteMarketplace,
    toggleActive,
  };
};