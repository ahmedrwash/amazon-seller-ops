import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useAuditLog = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const logAction = useCallback(async ({
    action,
    tableName,
    recordId,
    oldValues = null,
    newValues = null,
    reason = null,
    metadata = {}
  }) => {
    if (!user) return; // Can't log if not authenticated

    setIsLogging(true);
    setError(null);

    try {
      // Calculate changes if both exist
      let changes = null;
      if (oldValues && newValues) {
        changes = {};
        Object.keys(newValues).forEach(key => {
          if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
            changes[key] = {
              from: oldValues[key],
              to: newValues[key]
            };
          }
        });
      }

      const { error: err } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          changes,
          reason,
          metadata,
          ip_address: 'client-side', // Real IP needs edge function
          user_agent: navigator.userAgent
        }]);

      if (err) throw err;

    } catch (err) {
      console.error('Failed to write audit log:', err);
      setError(err);
      // We generally don't block the UI for audit log failures, but we log to console
    } finally {
      setIsLogging(false);
    }
  }, [user]);

  return { logAction, isLogging, error };
};