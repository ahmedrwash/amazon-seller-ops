import { supabase } from '@/lib/customSupabaseClient';

export function useWeeklyDataTracking() {
  const trackChange = async (historyTable, productId, weekNumber, oldData, newData, changedFields, changeReason = '') => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const oldValues = {};
    const newValues = {};
    changedFields.forEach(field => {
      oldValues[field] = oldData[field];
      newValues[field] = newData[field];
    });

    const { error } = await supabase.from(historyTable).insert([{
      product_id: productId,
      week_number: weekNumber,
      old_values: oldValues,
      new_values: newValues,
      changed_fields: changedFields,
      change_reason: changeReason,
      changed_by: userId
    }]);

    if (error) console.error("Error tracking change:", error);
  };

  const loadHistory = async (historyTable, productId, weekNumber) => {
    const { data, error } = await supabase
      .from(historyTable)
      .select('*')
      .eq('product_id', productId)
      .eq('week_number', weekNumber)
      .order('changed_at', { ascending: false });
    
    if (error) {
      console.error("Error loading history:", error);
      return [];
    }
    return data || [];
  };

  return { trackChange, loadHistory };
}