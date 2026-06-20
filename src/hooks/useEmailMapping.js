import { supabase } from '@/lib/customSupabaseClient';
import { applyMapping as engineApply } from '@/utils/applyEngine';
import { EMAIL_STATUS, MAPPING_STATUS } from '@/constants/emailIntakeConstants';
import { useAuth } from '@/context/AuthContext';

export function useEmailMapping() {
  const { user, profile } = useAuth();
  
  const createMapping = async (emailId, mappingData) => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase
        .from('email_mappings')
        .insert([{
          email_id: emailId,
          ...mappingData,
          status: MAPPING_STATUS.DRAFT,
          created_by: user?.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, result: data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const updateMapping = async (mappingId, updates) => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase
        .from('email_mappings')
        .update(updates)
        .eq('id', mappingId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { success: true, result: data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const approveMapping = async (mappingId) => {
     try {
       if (!supabase) throw new Error("Supabase client not initialized");

       const { data, error } = await supabase
         .from('email_mappings')
         .update({ 
           status: MAPPING_STATUS.APPROVED, 
           approved_by: user?.id,
           approved_at: new Date().toISOString()
         })
         .eq('id', mappingId)
         .select()
         .maybeSingle();
 
       if (error) throw error;
       return { success: true, result: data };
     } catch (err) {
       return { success: false, error: err };
     }
  };

  const applyMapping = async (mappingId) => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      // 1. Fetch mapping
      const { data: mapping, error: fetchError } = await supabase
        .from('email_mappings')
        .select('*')
        .eq('id', mappingId)
        .maybeSingle();

      if (fetchError) return { success: false, error: fetchError };
      if (!mapping) return { success: false, error: 'Mapping not found' };

      // 2. Admin Check
      if (profile?.role !== 'admin') {
        return { success: false, error: 'Only Admins can apply mappings to live data.' };
      }

      // 3. Apply via Engine
      const { success, result, error: engineError } = await engineApply(mapping, supabase);

      if (!success) return { success: false, error: engineError };

      // 4. Update Mapping Status
      await supabase
        .from('email_mappings')
        .update({ 
          status: MAPPING_STATUS.APPLIED,
          applied_by: user?.id,
          applied_at: new Date().toISOString()
        })
        .eq('id', mappingId);

      // 5. Update Email Status
      await supabase
        .from('inbound_emails')
        .update({ status: EMAIL_STATUS.PROCESSED })
        .eq('id', mapping.email_id);

      return { success: true, result };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const rejectMapping = async (mappingId, reason) => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase
        .from('email_mappings')
        .update({ 
          status: MAPPING_STATUS.REJECTED,
          rejection_reason: reason
        })
        .eq('id', mappingId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { success: true, result: data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return { createMapping, updateMapping, approveMapping, applyMapping, rejectMapping };
}