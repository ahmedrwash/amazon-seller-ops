import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export function useEmailTest() {
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const testIMAPConnection = async (credentials) => {
    setTesting(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      // Construct the payload with specific IMAP parameters
      const payload = {
        credential_id: credentials.id,
        imap_server: credentials.imap_server,
        imap_port: credentials.imap_port ? parseInt(credentials.imap_port) : undefined,
        imap_username: credentials.imap_username,
        imap_password: credentials.imap_password,
        test_type: 'imap'
      };

      // Client-side validation
      if (!payload.credential_id) {
        if (!payload.imap_server || !payload.imap_username || !payload.imap_password) {
           throw new Error("Missing connection details. Please fill in all IMAP fields.");
        }
      }

      const { data, error } = await supabase.functions.invoke('test-email-connection', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (error) {
        console.error('Edge Function Error:', error);
        throw error;
      }

      if (data && data.success) {
        toast({
          title: "Connection Successful",
          description: data.message,
          className: "bg-green-600 text-white border-green-700"
        });
        return { success: true, message: data.message };
      } else {
        throw new Error(data?.error || "Connection failed");
      }

    } catch (err) {
      console.error('Test connection error:', err);
      toast({
        title: "Connection Failed",
        description: err.message || "Unknown error occurred",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    } finally {
      setTesting(false);
    }
  };

  return {
    testing,
    testIMAPConnection
  };
}