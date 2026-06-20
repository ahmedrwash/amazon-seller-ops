import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useEmailSyncStatus = () => {
  const [status, setStatus] = useState({
    loading: true,
    error: null,
    credentials_count: 0,
    active_credentials_count: 0,
    total_emails: 0,
    last_email_time: null,
    last_sync_time: null,
    function_status: 'unknown'
  });

  const fetchStatus = useCallback(async () => {
    try {
      // 1. Fetch Credentials Info
      const { data: creds, error: credError } = await supabase
        .from('email_credentials')
        .select('id, is_active, last_tested_at');

      if (credError) throw credError;

      const activeCreds = creds.filter(c => c.is_active);
      const lastSync = activeCreds
         .map(c => c.last_tested_at)
         .sort()
         .reverse()[0];

      // 2. Fetch Email Count & Last Received
      // Use email_intake if available, otherwise inbound_emails fallback
      let emailTable = 'email_intake';
      let { count, error: countError } = await supabase
        .from(emailTable)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
         // Fallback if migration not run yet
         emailTable = 'inbound_emails';
         const fallback = await supabase
           .from(emailTable)
           .select('*', { count: 'exact', head: true });
         count = fallback.count;
      }

      const { data: lastEmail } = await supabase
        .from(emailTable)
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStatus({
        loading: false,
        error: null,
        credentials_count: creds.length,
        active_credentials_count: activeCreds.length,
        total_emails: count || 0,
        last_email_time: lastEmail?.created_at || null,
        last_sync_time: lastSync || null,
        function_status: 'ready'
      });

    } catch (err) {
      console.error('Sync Status Error:', err);
      setStatus(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // 1 min refresh
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { ...status, refresh: fetchStatus };
};