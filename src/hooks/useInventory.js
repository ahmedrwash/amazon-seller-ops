import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product_marketplaces (
            id,
            marketplaces (code, name),
            products (id, product_name, main_category)
          ),
          warehouses (id, name, type)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast({ title: 'Error', description: 'Failed to fetch inventory', variant: 'destructive' });
      setInventory([]); // Ensure array on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createInventory = async (data) => {
    setLoading(true);
    try {
      const { data: newItem, error } = await supabase
        .from('inventory')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .maybeSingle(); // Changed from .single()

      if (error) throw error;
      if (!newItem) throw new Error('Failed to create inventory item');

      toast({ title: 'Success', description: 'Inventory item added' });
      fetchInventory();
      return newItem;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add inventory', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .maybeSingle(); // Changed from .single()

      if (error) throw error;
      if (!data) throw new Error('Inventory item not found or update failed');

      toast({ title: 'Success', description: 'Inventory updated' });
      fetchInventory();
      return data;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update inventory', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventory = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      setInventory(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Success', description: 'Inventory item deleted' });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete inventory', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { inventory, loading, fetchInventory, createInventory, updateInventory, deleteInventory };
};