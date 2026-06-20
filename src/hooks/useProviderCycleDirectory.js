import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { PROVIDER_STAGES } from '@/constants/providerPlaybooks';

export const useProviderCycleDirectory = (filters) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('service_providers')
          .select(`
            *,
            provider_services(*),
            provider_communications(*)
          `);

        if (filters?.status?.length) {
          query = query.in('status', filters.status);
        }
        
        if (filters?.rating) {
           query = query.gte('internal_rating', filters.rating);
        }
        
        if (filters?.riskLevel?.length) {
           query = query.in('risk_level', filters.riskLevel);
        }

        const { data, error: err } = await query;
        if (err) throw err;

        // Client side filtering for complex relations like marketplaces/services if needed
        let filtered = data;
        if (filters?.marketplaces?.length > 0) {
           filtered = filtered.filter(p => 
              p.provider_services.some(s => 
                 s.marketplaces && s.marketplaces.some(m => filters.marketplaces.includes(m))
              )
           );
        }
        
        if (filters?.serviceAreas?.length > 0) {
           filtered = filtered.filter(p => 
              p.provider_services.some(s => filters.serviceAreas.includes(s.service_area))
           );
        }

        setProviders(filtered);
      } catch (err) {
        console.error('Error fetching providers directory:', err);
        setError(err);
        toast({
          variant: "destructive",
          title: "Error loading directory",
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [JSON.stringify(filters), toast]);

  const groupedProviders = {
    [PROVIDER_STAGES.LEAD]: [],
    [PROVIDER_STAGES.SHORTLISTED]: [],
    [PROVIDER_STAGES.EVALUATION]: [],
    [PROVIDER_STAGES.CONTRACTING]: [],
    [PROVIDER_STAGES.ACTIVE]: [],
    [PROVIDER_STAGES.PAUSED]: [],
    [PROVIDER_STAGES.RENEWAL_REVIEW]: [],
    [PROVIDER_STAGES.REJECTED]: [],
    [PROVIDER_STAGES.EXITED]: [],
  };

  providers.forEach(p => {
    const stage = p.status || PROVIDER_STAGES.LEAD;
    if (groupedProviders[stage]) {
      groupedProviders[stage].push(p);
    } else {
        // Fallback for unknown status
       if(!groupedProviders['Other']) groupedProviders['Other'] = [];
       groupedProviders['Other'].push(p);
    }
  });

  return { providers, groupedProviders, loading, error };
};