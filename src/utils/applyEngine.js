import { ALLOWED_TABLES, MAPPING_ACTIONS } from '@/constants/emailIntakeConstants';

export async function applyMapping(mapping, supabaseClient) {
  if (!mapping) return { success: false, error: 'No mapping provided' };
  
  const { target_table, action_type, target_record_id, field_mappings } = mapping;

  // 1. Validate allowlist
  if (!ALLOWED_TABLES.includes(target_table)) {
    return { success: false, error: `Table ${target_table} is not in the allowed list for security.` };
  }

  try {
    let result;

    // 2. Perform Action
    if (action_type === MAPPING_ACTIONS.INSERT) {
      const { data, error } = await supabaseClient
        .from(target_table)
        .insert([field_mappings])
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else if (action_type === MAPPING_ACTIONS.UPDATE) {
      if (!target_record_id) {
        return { success: false, error: 'Target Record ID is missing for UPDATE action.' };
      }
      
      const { data, error } = await supabaseClient
        .from(target_table)
        .update(field_mappings)
        .eq('id', target_record_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      return { success: false, error: 'Invalid action type.' };
    }

    return { success: true, result };

  } catch (err) {
    console.error('Apply Engine Error:', err);
    return { success: false, error: err.message || 'Unknown error during application.' };
  }
}