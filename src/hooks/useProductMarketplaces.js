import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useProductMarketplaces = () => {
  const [marketplaces, setMarketplaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const getProductMarketplaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase
        .from('product_marketplaces')
        .select(`
          id,
          product_id,
          marketplace_id,
          stage,
          priority,
          go_live_date,
          blockers,
          products (
            id,
            product_name,
            brand
          ),
          marketplaces (
            id,
            name,
            code
          )
        `);

      if (err) throw err;

      // Sort by product name then marketplace name
      const sortedData = (result || []).sort((a, b) => {
        const prodA = a.products?.product_name || '';
        const prodB = b.products?.product_name || '';
        const marketA = a.marketplaces?.name || '';
        const marketB = b.marketplaces?.name || '';
        
        if (prodA !== prodB) return prodA.localeCompare(prodB);
        return marketA.localeCompare(marketB);
      });

      setMarketplaces(sortedData);
    } catch (err) {
      console.error('Error fetching product marketplaces:', err);
      setError(err);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch product marketplaces', 
        variant: 'destructive' 
      });
      setMarketplaces([]); // Ensure we always return an array
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addMarketplace = async (productId, marketplaceId, marketplaceData) => {
    try {
      setLoading(true);
      const { error: insertError } = await supabase
        .from('product_marketplaces')
        .insert([{
          product_id: productId,
          marketplace_id: marketplaceId,
          ...marketplaceData
        }]);

      if (insertError) throw insertError;
      toast({ title: 'Success', description: 'Marketplace added' });
      getProductMarketplaces();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateMarketplace = async (id, marketplaceData) => {
    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('product_marketplaces')
        .update(marketplaceData)
        .eq('id', id);

      if (updateError) throw updateError;
      toast({ title: 'Success', description: 'Marketplace updated' });
      getProductMarketplaces();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (id, newStage) => {
    try {
      // Optimistic update
      setMarketplaces(prev => prev.map(item => 
        item.id === id ? { ...item, stage: newStage } : item
      ));

      const { error: updateError } = await supabase
        .from('product_marketplaces')
        .update({ stage: newStage, updated_at: new Date() })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Silent success for drag and drop unless error
    } catch (err) {
      console.error('Error updating stage:', err);
      toast({ title: 'Error', description: 'Failed to update stage', variant: 'destructive' });
      getProductMarketplaces(); // Revert/Refresh on error
    }
  };

  const removeMarketplace = async (id) => {
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('product_marketplaces')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      toast({ title: 'Success', description: 'Marketplace removed' });
      getProductMarketplaces();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    marketplaces: marketplaces || [], // Defensive check
    loading,
    error,
    getProductMarketplaces,
    // Alias for compatibility if needed, though we are fixing components
    fetchProductMarketplaces: getProductMarketplaces, 
    addMarketplace,
    updateMarketplace,
    updateStage,
    removeMarketplace
  };
};