import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useReorderAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reorder_alerts')
        .select(`
          *,
          inventory (
             id,
             on_hand,
             reserved,
             product_marketplaces (
                products (product_name),
                marketplaces (code)
             ),
             warehouses (name)
          )
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch alerts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createAlert = async (data) => {
    setLoading(true);
    try {
      const { data: newItem, error } = await supabase
        .from('reorder_alerts')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Alert created' });
      fetchAlerts();
      return newItem;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create alert', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id, notes) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reorder_alerts')
        .update({ 
           status: 'Resolved', 
           resolution_notes: notes, 
           resolved_at: new Date(), 
           resolved_by: user.id 
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Alert resolved' });
      setAlerts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to resolve alert', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id) => {
     setLoading(true);
     try {
        const { error } = await supabase.from('reorder_alerts').delete().eq('id', id);
        if (error) throw error;
        setAlerts(prev => prev.filter(a => a.id !== id));
        toast({ title: 'Success', description: 'Alert deleted' });
     } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to delete alert', variant: 'destructive' });
     } finally {
        setLoading(false);
     }
  };

  return { alerts, loading, fetchAlerts, createAlert, resolveAlert, deleteAlert };
};