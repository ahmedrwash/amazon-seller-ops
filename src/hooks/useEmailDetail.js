import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useEmailDetail() {
  const [email, setEmail] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEmailDetail = useCallback(async (emailId) => {
    if (!emailId) return;
    setLoading(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      // Fetch Email - Use maybeSingle() to avoid error if not found
      const { data: emailData, error: emailError } = await supabase
        .from('inbound_emails')
        .select('*')
        .eq('id', emailId)
        .maybeSingle();
      
      if (emailError) throw emailError;
      if (!emailData) throw new Error('Email not found');

      // Fetch Attachments
      const { data: attData, error: attError } = await supabase
        .from('inbound_email_attachments')
        .select('*')
        .eq('email_id', emailId);

      if (attError) throw attError;

      // Fetch Mappings
      const { data: mapData, error: mapError } = await supabase
        .from('email_mappings')
        .select('*')
        .eq('email_id', emailId);

      if (mapError) throw mapError;

      setEmail(emailData);
      setAttachments(attData || []);
      setMappings(mapData || []);

      return { email: emailData, attachments: attData, mappings: mapData };

    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { email, attachments, mappings, loading, error, getEmailDetail };
}