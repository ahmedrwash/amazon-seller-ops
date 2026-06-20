import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useProviders = (filters = {}) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { session } = useAuth();
  const abortControllerRef = useRef(null);

  const fetchProviders = useCallback(async () => {
    if (!session) {
        setLoading(false);
        return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('service_providers')
        .select(`
          *,
          provider_services (service_area, marketplaces)
        `)
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`provider_name.ilike.%${filters.search}%,primary_contact_email.ilike.%${filters.search}%`);
      }
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);
      if (filters.rating) query = query.gte('internal_rating', filters.rating);

      const { data, error: err } = await query.abortSignal(abortControllerRef.current.signal);

      if (err) {
          if (err.name === 'AbortError') return; // Ignore abort errors
          throw err;
      }
      
      setProviders(data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching providers:', err);
        setError(err);
        toast({
            title: 'Error',
            description: 'Failed to fetch providers. Please try again.',
            variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, filters.risk_level, filters.rating, session, toast]);

  useEffect(() => {
    fetchProviders();
    return () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };
  }, [fetchProviders]);

  return { providers, loading, error, refetch: fetchProviders };
};

export const useProviderById = (id) => {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  const fetchProvider = useCallback(async () => {
    if (!id || !session) {
        setLoading(false);
        return;
    }
    
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single();

      if (err) throw err;
      setProvider(data);
    } catch (err) {
      console.error('Error fetching provider details:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  return { provider, loading, error, refetch: fetchProvider };
};

export const useCreateProvider = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const createProvider = async (payload) => {
    if (!user) return { data: null, error: new Error("User not authenticated") };

    setLoading(true);
    try {
      const { services, ...providerData } = payload;
      
      // 1. Create Provider
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .insert({ ...providerData, created_by: user.id })
        .select()
        .single();

      if (providerError) throw providerError;

      // 2. Create Services if any
      if (services && services.length > 0) {
        const servicesWithId = services.map(s => ({ ...s, provider_id: provider.id }));
        const { error: servicesError } = await supabase
          .from('provider_services')
          .insert(servicesWithId);
        
        if (servicesError) throw servicesError;
      }

      return { data: provider, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return { createProvider, loading };
};

// ... Helper hooks for sub-resources
export const useServices = (providerId) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const fetchServices = useCallback(async () => {
    if(!providerId || !session) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const { data, error } = await supabase.from('provider_services').select('*').eq('provider_id', providerId);
        if (error) throw error;
        setServices(data || []);
    } catch (err) {
        console.error("Error fetching services:", err);
    } finally {
        setLoading(false);
    }
  }, [providerId, session]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const addService = async (serviceData) => {
    const { error } = await supabase.from('provider_services').insert({ ...serviceData, provider_id: providerId });
    if (!error) fetchServices();
    return { error };
  };

  const deleteService = async (id) => {
    const { error } = await supabase.from('provider_services').delete().eq('id', id);
    if (!error) fetchServices();
    return { error };
  };

  return { services, loading, addService, deleteService };
};

export const useDocuments = (providerId) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if(!providerId || !session) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const { data, error } = await supabase.from('provider_documents').select('*').eq('provider_id', providerId).order('uploaded_at', { ascending: false });
        if (error) throw error;
        setDocuments(data || []);
    } catch (err) {
        console.error("Error fetching documents:", err);
    } finally {
        setLoading(false);
    }
  }, [providerId, session]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const addDocument = async (docData) => {
    const { error } = await supabase.from('provider_documents').insert({ ...docData, provider_id: providerId });
    if (!error) fetchDocuments();
    return { error };
  };

  const deleteDocument = async (id) => {
    const { error } = await supabase.from('provider_documents').delete().eq('id', id);
    if (!error) fetchDocuments();
    return { error };
  };

  return { documents, loading, addDocument, deleteDocument };
};

export const useCommunications = (providerId) => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const fetchComms = useCallback(async () => {
    if(!providerId || !session) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const { data, error } = await supabase
        .from('provider_communications')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCommunications(data || []);
    } catch (err) {
        console.error("Error fetching communications:", err);
    } finally {
        setLoading(false);
    }
  }, [providerId, session]);

  useEffect(() => { fetchComms(); }, [fetchComms]);

  const addCommunication = async (commData) => {
    if (!user) return { error: new Error("User not authenticated") };
    const { error } = await supabase.from('provider_communications').insert({ 
      ...commData, 
      provider_id: providerId,
      created_by: user.id 
    });
    if (!error) fetchComms();
    return { error };
  };

  const updateCommunication = async (id, updates) => {
      const { error } = await supabase.from('provider_communications').update(updates).eq('id', id);
      if(!error) fetchComms();
      return { error };
  };

  const deleteCommunication = async (id) => {
    const { error } = await supabase.from('provider_communications').delete().eq('id', id);
    if (!error) fetchComms();
    return { error };
  };

  return { communications, loading, addCommunication, updateCommunication, deleteCommunication };
};

export const useUpdateProvider = () => {
    const updateProvider = async (id, updates) => {
        const { error } = await supabase.from('service_providers').update(updates).eq('id', id);
        return { error };
    };
    return { updateProvider };
}

export const useDeleteProvider = () => {
    const deleteProvider = async (id) => {
        const { error } = await supabase.from('service_providers').delete().eq('id', id);
        return { error };
    }
    return { deleteProvider };
}