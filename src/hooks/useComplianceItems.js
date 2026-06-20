import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useComplianceItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchComplianceItems = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Removed invalid 'owner_user:owner' join as there is no foreign key relationship
      let query = supabase
        .from('compliance_items')
        .select(`
          *,
          product_marketplaces (
            id,
            products (id, product_name),
            marketplaces (id, code, name)
          )
        `);

      if (filters.product_marketplace_id) {
        query = query.eq('product_marketplace_id', filters.product_marketplace_id);
      }
      
      // Additional filters can be added here
      if (filters.status) query = query.in('status', filters.status);
      if (filters.owner) query = query.eq('owner', filters.owner);

      const { data, error: err } = await query;

      if (err) throw err;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching compliance items:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch compliance items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createComplianceItem = async (newItem) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('compliance_items')
        .insert([newItem])
        .select()
        .single();

      if (err) throw err;

      setItems(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Compliance item created successfully',
      });
      return data;
    } catch (err) {
      console.error('Error creating compliance item:', err);
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

  const updateComplianceItem = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('compliance_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
      toast({
        title: 'Success',
        description: 'Compliance item updated',
      });
      return data;
    } catch (err) {
      console.error('Error updating compliance item:', err);
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

  const deleteComplianceItem = async (id) => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('compliance_items')
        .delete()
        .eq('id', id);

      if (err) throw err;

      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Success',
        description: 'Compliance item deleted',
      });
      return true;
    } catch (err) {
      console.error('Error deleting compliance item:', err);
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
    items,
    loading,
    error,
    fetchComplianceItems,
    createComplianceItem,
    updateComplianceItem,
    deleteComplianceItem
  };
};