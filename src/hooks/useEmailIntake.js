import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useEmailIntake() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getInboxEmails = useCallback(async ({ status, search, reviewer, page = 0, limit = 20 } = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      let query = supabase
        .from('inbound_emails')
        .select('*', { count: 'exact' })
        .order('received_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (status && status.length > 0) {
        query = query.in('status', status);
      }
      
      if (reviewer) {
        if (reviewer === 'unassigned') {
          query = query.is('assigned_reviewer', null);
        } else {
          query = query.eq('assigned_reviewer', reviewer);
        }
      }

      if (search) {
        query = query.or(`subject.ilike.%${search}%,inbound_from.ilike.%${search}%`);
      }

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      const safeData = data || [];
      const safeCount = count === null ? 0 : count;

      setEmails(safeData);
      return { emails: safeData, count: safeCount };

    } catch (err) {
      console.error('Error fetching inbox emails:', err);
      setError(err);
      return { emails: [], count: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const syncEmails = useCallback(async () => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase.functions.invoke('poll-imap-emails', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      if (error) {
        console.error('Edge Function Error:', error);
        throw error;
      }
      
      // Check for application-level error returned in 200 OK response
      if (data && data.error) {
        throw new Error(data.error);
      }

      return { success: true, count: data?.count || 0 };
    } catch (err) {
      console.error('Sync failed:', err);
      return { 
        success: false, 
        error: err,
        message: err.message || 'Failed to sync emails'
      };
    }
  }, []);

  return { emails, loading, error, getInboxEmails, syncEmails };
}