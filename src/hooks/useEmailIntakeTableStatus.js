import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useEmailIntakeTableStatus = () => {
  const [status, setStatus] = useState({
    exists: false,
    count: 0,
    recent: [],
    loading: true,
    error: null,
    rlsStatus: 'unknown'
  });

  const checkTable = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));

      // 1. Check if we can select from the table
      const { count, error: countError } = await supabase
        .from('email_intake')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        // If the table doesn't exist, Supabase usually returns a 404 or specific message
        if (countError.message.includes('relation "public.email_intake" does not exist')) {
            setStatus(prev => ({ ...prev, exists: false, loading: false }));
            return;
        }
        // If it's a permission error, the table exists but RLS might be blocking
        if (countError.code === '42501') { // Postgres permission denied
             setStatus(prev => ({ ...prev, exists: true, rlsStatus: 'blocked', loading: false }));
             return;
        }
        throw countError;
      }

      // 2. Fetch Recent Emails
      const { data: recent, error: dataError } = await supabase
        .from('email_intake')
        .select('id, subject, from_address, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (dataError) throw dataError;

      setStatus({
        exists: true,
        count: count || 0,
        recent: recent || [],
        loading: false,
        error: null,
        rlsStatus: 'active'
      });

    } catch (err) {
      console.error('Table Check Error:', err);
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message,
        exists: false // Assume false if unknown error for safety, or handle specifically
      }));
    }
  }, []);

  useEffect(() => {
    checkTable();
  }, [checkTable]);

  return { ...status, refresh: checkTable };
};