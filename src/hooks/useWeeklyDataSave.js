import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useWeeklyDataTracking } from './useWeeklyDataTracking';
import { useToast } from '@/components/ui/use-toast';

const SECTION_HISTORY_TABLES = {
  profit: 'profit_margin_history',
  ppc: 'ppc_acos_history',
  inventory: 'inventory_history',
  fba: 'fba_fees_history',
  breakeven: 'breakeven_history',
  cashflow: 'cashflow_history',
  tariff: 'tariff_cogs_history',
  kpis: 'kpis_history',
  milestones: 'milestones_history'
};

export function useWeeklyDataSave() {
  const { trackChange } = useWeeklyDataTracking();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const saveWeeklyData = async (section, updates, selectedProduct, selectedWeek, currentWeeklyData, callback) => {
    if (!selectedProduct || !selectedWeek) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Find changed fields
      const changedFields = [];
      const oldData = currentWeeklyData || {};
      
      Object.keys(updates).forEach(key => {
        if (updates[key] !== oldData[key]) {
          changedFields.push(key);
        }
      });

      const newDataToSave = {
        product_id: selectedProduct,
        week_number: selectedWeek,
        user_id: userId,
        updated_at: new Date().toISOString(),
        ...updates
      };

      const { data: savedData, error } = await supabase
        .from('product_weekly_data')
        .upsert(newDataToSave, { onConflict: 'product_id,week_number' })
        .select()
        .single();

      if (error) throw error;

      if (changedFields.length > 0 && SECTION_HISTORY_TABLES[section]) {
        await trackChange(
          SECTION_HISTORY_TABLES[section],
          selectedProduct,
          selectedWeek,
          oldData,
          updates,
          changedFields,
          'User update via Operations Hub'
        );
      }

      toast({ title: "Data saved successfully" });
      if (callback) callback(savedData);
    } catch (err) {
      console.error(err);
      toast({ title: "Error saving data", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return { saveWeeklyData, isSaving };
}