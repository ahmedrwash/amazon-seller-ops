import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useProviderCycle = (providerId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchProviderData = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select(`
          *,
          provider_services(*),
          provider_communications(*),
          provider_documents(*)
        `)
        .eq('id', providerId)
        .single();

      if (providerError) throw providerError;

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('entity_type', 'Provider')
        .eq('entity_id', providerId);

      if (tasksError) throw tasksError;

      setData({
        ...provider,
        tasks: tasks || []
      });
    } catch (err) {
      console.error('Error fetching provider cycle data:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error loading provider",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [providerId, toast]);

  useEffect(() => {
    fetchProviderData();
  }, [fetchProviderData]);

  return { data, loading, error, refetch: fetchProviderData };
};