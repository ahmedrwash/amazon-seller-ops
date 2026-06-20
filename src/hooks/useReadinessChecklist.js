import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useReadinessChecklist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchReadinessItems = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('readiness_checklist')
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
      
      const { data, error: err } = await query;

      if (err) throw err;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching readiness items:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch checklist items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createReadinessItem = async (newItem) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('readiness_checklist')
        .insert([newItem])
        .select()
        .single();

      if (err) throw err;

      setItems(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Checklist item added successfully',
      });
      return data;
    } catch (err) {
      console.error('Error creating checklist item:', err);
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

  const updateReadinessItem = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('readiness_checklist')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
      toast({
        title: 'Success',
        description: 'Checklist item updated',
      });
      return data;
    } catch (err) {
      console.error('Error updating checklist item:', err);
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

  const deleteReadinessItem = async (id) => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('readiness_checklist')
        .delete()
        .eq('id', id);

      if (err) throw err;

      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Success',
        description: 'Checklist item deleted',
      });
      return true;
    } catch (err) {
      console.error('Error deleting checklist item:', err);
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
    fetchReadinessItems,
    createReadinessItem,
    updateReadinessItem,
    deleteReadinessItem
  };
};