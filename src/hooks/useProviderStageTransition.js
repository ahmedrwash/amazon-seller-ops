import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { updateCycleMetadata } from '@/utils/cycleMetadataUtils';

export const useProviderStageTransition = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const moveProviderToStage = async (provider, newStage, transitionNotes) => {
    setLoading(true);
    try {
      // 1. Update cycle metadata with transition history
      const historyEntry = {
        from: provider.status,
        to: newStage,
        date: new Date().toISOString(),
        notes: transitionNotes
      };
      
      const currentNotes = provider.notes || '';
      const newNotes = updateCycleMetadata(currentNotes, {
        lastStageChange: historyEntry
      }); // In real app, might want array of history

      // 2. Update provider record
      const { error } = await supabase
        .from('service_providers')
        .update({
          status: newStage,
          notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id);

      if (error) throw error;
      
      // 3. Optional: Log communication automatically?
      // For now, just return success
      
      toast({
        title: "Stage Updated",
        description: `Provider moved to ${newStage}`,
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error moving stage:', err);
      toast({
        variant: "destructive",
        title: "Transition Failed",
        description: err.message
      });
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { moveProviderToStage, loading };
};