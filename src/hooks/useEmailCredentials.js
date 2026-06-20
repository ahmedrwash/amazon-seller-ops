import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { encryptPassword } from '@/utils/emailCredentialsUtils';
import { useToast } from '@/components/ui/use-toast';

export function useEmailCredentials() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const getEmailCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase
        .from('email_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load email credentials.",
        variant: "destructive"
      });
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createEmailCredentials = async (formData) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const encryptedImapPass = encryptPassword(formData.imap_password);
      const encryptedSmtpPass = formData.smtp_password ? encryptPassword(formData.smtp_password) : null;

      const payload = {
        email_address: formData.email_address,
        imap_server: formData.imap_server,
        imap_port: parseInt(formData.imap_port) || 993,
        imap_username: formData.imap_username,
        imap_password: encryptedImapPass,
        smtp_server: formData.smtp_server || null,
        smtp_port: formData.smtp_port ? parseInt(formData.smtp_port) : 587,
        smtp_username: formData.smtp_username || null,
        smtp_password: encryptedSmtpPass,
        created_by: user.id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('email_credentials')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: "Success", description: "Email account added successfully." });
      return { data, error: null };
    } catch (err) {
      console.error('Error creating credential:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to create credential.",
        variant: "destructive"
      });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateEmailCredentials = async (id, formData) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const updates = {
        email_address: formData.email_address,
        imap_server: formData.imap_server,
        imap_port: parseInt(formData.imap_port),
        imap_username: formData.imap_username,
        smtp_server: formData.smtp_server || null,
        smtp_port: formData.smtp_port ? parseInt(formData.smtp_port) : null,
        smtp_username: formData.smtp_username || null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };

      // Only update passwords if provided (not empty)
      if (formData.imap_password) {
        updates.imap_password = encryptPassword(formData.imap_password);
      }
      if (formData.smtp_password) {
        updates.smtp_password = encryptPassword(formData.smtp_password);
      }

      const { data, error } = await supabase
        .from('email_credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      toast({ title: "Success", description: "Email settings updated." });
      return { data, error: null };
    } catch (err) {
      console.error('Error updating credential:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update credential.",
        variant: "destructive"
      });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteEmailCredentials = async (id) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { error } = await supabase
        .from('email_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Deleted", description: "Email account removed." });
      return { error: null };
    } catch (err) {
      console.error('Error deleting credential:', err);
      toast({
        title: "Error",
        description: "Failed to delete credential.",
        variant: "destructive"
      });
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id, currentStatus) => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { error } = await supabase
        .from('email_credentials')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  return {
    loading,
    error,
    getEmailCredentials,
    createEmailCredentials,
    updateEmailCredentials,
    deleteEmailCredentials,
    toggleActiveStatus
  };
}