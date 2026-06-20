import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useCostEntries = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCostEntries = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('cost_entries').select('*').order('period', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch costs', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCostEntry = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('cost_entries').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Cost entry added' });
      return res;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add cost', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchCostEntries, createCostEntry };
};

export const useRevenueEntries = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRevenueEntries = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('revenue_entries').select('*').order('period', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch revenue', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createRevenueEntry = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('revenue_entries').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Revenue entry added' });
      return res;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add revenue', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchRevenueEntries, createRevenueEntry };
};

export const useFinancialTargets = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTargets = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('financial_targets').select('*').order('created_at', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch targets', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTarget = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('financial_targets').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Target added' });
      return res;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add target', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchTargets, createTarget };
};