import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useSupplierSamples = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchSamples = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('supplier_samples')
        .select(`
          *,
          products (id, product_name)
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setSamples(data || []);
    } catch (err) {
      console.error('Error fetching samples:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch samples',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSample = async (sampleData) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('supplier_samples')
        .insert([sampleData])
        .select(`
           *,
           products (id, product_name)
        `)
        .single();

      if (err) throw err;

      setSamples(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Sample request logged',
      });
      return data;
    } catch (err) {
      console.error('Error creating sample:', err);
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

  const updateSample = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('supplier_samples')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select(`
           *,
           products (id, product_name)
        `)
        .single();

      if (err) throw err;

      setSamples(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      toast({
        title: 'Success',
        description: 'Sample updated',
      });
      return data;
    } catch (err) {
      console.error('Error updating sample:', err);
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

  const deleteSample = async (id) => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('supplier_samples')
        .delete()
        .eq('id', id);

      if (err) throw err;

      setSamples(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Success',
        description: 'Sample deleted',
      });
      return true;
    } catch (err) {
      console.error('Error deleting sample:', err);
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
    samples,
    loading,
    error,
    fetchSamples,
    createSample,
    updateSample,
    deleteSample
  };
};