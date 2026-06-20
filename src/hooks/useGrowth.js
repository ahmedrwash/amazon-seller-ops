import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const usePpcWeekly = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchWeeklyMetrics = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('ppc_weekly').select('*').order('week_start_date', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch weekly metrics', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addWeekly = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('ppc_weekly').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Weekly metric added' });
      return res;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add weekly metric', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteWeekly = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('ppc_weekly').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Metric deleted' });
      return true;
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete metric', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchWeeklyMetrics, addWeekly, deleteWeekly };
};

export const usePpcCampaigns = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCampaigns = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('ppc_campaigns').select('*').order('created_at', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch campaigns', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addCampaign = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('ppc_campaigns').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Campaign added' });
      return res;
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add campaign', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchCampaigns, addCampaign };
};

export const useGrowthTargets = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTargets = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('growth_targets').select('*').order('created_at', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch targets', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addTarget = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('growth_targets').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Target added' });
      return res;
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add target', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchTargets, addTarget };
};

export const useGrowthInsights = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInsights = useCallback(async (productMarketplaceId) => {
    setLoading(true);
    try {
      let query = supabase.from('growth_insights').select('*').order('created_at', { ascending: false });
      if (productMarketplaceId) query = query.eq('product_marketplace_id', productMarketplaceId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch insights', variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addInsight = async (data) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('growth_insights').insert([{ ...data, created_by: user.id }]).select().maybeSingle();
      if (error) throw error;
      if (!res) throw new Error('No data returned');
      toast({ title: 'Success', description: 'Insight added' });
      return res;
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add insight', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchInsights, addInsight };
};