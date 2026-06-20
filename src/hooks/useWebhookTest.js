import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useWebhookTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const runTest = async (payload) => {
    setTesting(true);
    setResult(null);

    try {
      console.log('Testing webhook with payload:', payload);

      // Invoke the edge function directly
      const { data, error } = await supabase.functions.invoke('inbound-email-webhook', {
        body: payload,
        headers: {
            // Simulate typical email provider headers
            'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      setResult({
        success: true,
        data: data,
        message: 'Webhook processed the test payload successfully.'
      });
      
      return { success: true, data };

    } catch (err) {
      console.error('Webhook Test Error:', err);
      setResult({
        success: false,
        error: err.message,
        message: 'Failed to invoke webhook.'
      });
      return { success: false, error: err };
    } finally {
      setTesting(false);
    }
  };

  return {
    testing,
    result,
    runTest
  };
};