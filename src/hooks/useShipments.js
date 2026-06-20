import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          product_marketplaces (
             products (product_name)
          ),
          from_warehouse:from_warehouse_id (name),
          to_warehouse:to_warehouse_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch shipments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createShipment = async (data) => {
    setLoading(true);
    try {
      const { data: newItem, error } = await supabase
        .from('shipments')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Shipment created' });
      fetchShipments();
      return newItem;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create shipment', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateShipment = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Shipment updated' });
      fetchShipments();
      return data;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update shipment', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteShipment = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      setShipments(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Success', description: 'Shipment deleted' });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete shipment', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { shipments, loading, fetchShipments, createShipment, updateShipment, deleteShipment };
};