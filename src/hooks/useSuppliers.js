import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('suppliers')
        .select(`
            *,
            supplier_quotes (count),
            supplier_samples (count)
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch suppliers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSupplier = async (supplierData) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('suppliers')
        .insert([{ ...supplierData, created_by: user.id }])
        .select()
        .single();

      if (err) throw err;

      setSuppliers(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Supplier created successfully',
      });
      return data;
    } catch (err) {
      console.error('Error creating supplier:', err);
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

  const updateSupplier = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('suppliers')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      toast({
        title: 'Success',
        description: 'Supplier updated',
      });
      return data;
    } catch (err) {
      console.error('Error updating supplier:', err);
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

  const deleteSupplier = async (id) => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (err) throw err;

      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Success',
        description: 'Supplier deleted',
      });
      return true;
    } catch (err) {
      console.error('Error deleting supplier:', err);
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

  const getSupplierById = async (id) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      console.error('Error fetching supplier details:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById
  };
};