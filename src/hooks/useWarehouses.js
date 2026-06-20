import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch warehouses and compute some aggregates (this is simplified; in production might need RPC or separate query)
      const { data, error } = await supabase
        .from('warehouses')
        .select(`
           *,
           marketplaces (code),
           inventory (on_hand)
        `)
        .order('name');

      if (error) throw error;

      // Process aggregated data for display
      const processed = data.map(w => ({
        ...w,
        total_units: w.inventory?.reduce((sum, i) => sum + (i.on_hand || 0), 0) || 0,
        active_skus: w.inventory?.length || 0
      }));

      setWarehouses(processed || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      toast({ title: 'Error', description: 'Failed to fetch warehouses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createWarehouse = async (data) => {
    setLoading(true);
    try {
      const { data: newItem, error } = await supabase
        .from('warehouses')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Warehouse created' });
      fetchWarehouses();
      return newItem;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create warehouse', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateWarehouse = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Warehouse updated' });
      fetchWarehouses();
      return data;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update warehouse', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteWarehouse = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('warehouses').delete().eq('id', id);
      if (error) throw error;
      setWarehouses(prev => prev.filter(w => w.id !== id));
      toast({ title: 'Success', description: 'Warehouse deleted' });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete warehouse', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { warehouses, loading, fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse };
};