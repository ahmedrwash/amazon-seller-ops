import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useSupplierQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchQuotes = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('supplier_quotes')
        .select(`
          *,
          products (id, product_name)
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setQuotes(data || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch quotes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchQuotesByProduct = useCallback(async (productId) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('supplier_quotes')
        .select(`
          *,
          suppliers (id, name, rating, country)
        `)
        .eq('product_id', productId)
        .order('unit_cost', { ascending: true });

      if (err) throw err;
      return data;
    } catch (err) {
      console.error('Error fetching quotes by product:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuote = async (quoteData) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('supplier_quotes')
        .insert([quoteData])
        .select(`
           *,
           products (id, product_name)
        `)
        .single();

      if (err) throw err;

      setQuotes(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Quote added successfully',
      });
      return data;
    } catch (err) {
      console.error('Error adding quote:', err);
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

  const updateQuote = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('supplier_quotes')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select(`
           *,
           products (id, product_name)
        `)
        .single();

      if (err) throw err;

      setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
      toast({
        title: 'Success',
        description: 'Quote updated',
      });
      return data;
    } catch (err) {
      console.error('Error updating quote:', err);
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

  const deleteQuote = async (id) => {
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('supplier_quotes')
        .delete()
        .eq('id', id);

      if (err) throw err;

      setQuotes(prev => prev.filter(q => q.id !== id));
      toast({
        title: 'Success',
        description: 'Quote deleted',
      });
      return true;
    } catch (err) {
      console.error('Error deleting quote:', err);
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
    quotes,
    loading,
    error,
    fetchQuotes,
    fetchQuotesByProduct,
    createQuote,
    updateQuote,
    deleteQuote
  };
};