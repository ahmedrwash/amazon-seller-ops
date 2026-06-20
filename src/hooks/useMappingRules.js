import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { matchRules } from '@/utils/emailIntakeUtils';

export function useMappingRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  const getRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_mapping_rules')
      .select('*')
      .order('priority', { ascending: false });
    
    if (!error) setRules(data);
    setLoading(false);
    return { rules: data, error };
  }, []);

  const createRule = async (ruleData) => {
    const { data, error } = await supabase
      .from('email_mapping_rules')
      .insert([ruleData])
      .select()
      .single();
    if (!error) getRules(); // Refresh
    return { result: data, error };
  };

  const updateRule = async (ruleId, updates) => {
    const { data, error } = await supabase
      .from('email_mapping_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();
    if (!error) getRules();
    return { result: data, error };
  };

  const deleteRule = async (ruleId) => {
    const { error } = await supabase
      .from('email_mapping_rules')
      .delete()
      .eq('id', ruleId);
    if (!error) getRules();
    return { error };
  };

  const testRule = (from, subject, rulesList) => {
     return matchRules(from, subject, rulesList || rules);
  };

  return { rules, loading, getRules, createRule, updateRule, deleteRule, testRule };
}