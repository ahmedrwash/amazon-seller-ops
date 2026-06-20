import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { PROVIDER_PLAYBOOKS } from '@/constants/providerPlaybooks';
import { useAuth } from '@/context/AuthContext';

export const usePlaybookTasks = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createPlaybookTasks = async (providerId, stage, assignedTo) => {
    const templates = PROVIDER_PLAYBOOKS[stage];
    if (!templates || templates.length === 0) {
      toast({ description: "No playbook defined for this stage." });
      return { success: true, count: 0 };
    }

    setLoading(true);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const tasksToCreate = templates.map(t => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + t.dueDaysFromNow);
        
        return {
          title: t.title,
          description: t.description,
          status: 'Open',
          priority: t.priority,
          entity_type: 'Provider',
          entity_id: providerId,
          assigned_to: assignedTo || user?.id,
          created_by: user?.id,
          due_date: dueDate.toISOString()
        };
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (error) throw error;

      toast({
        title: "Playbook Applied",
        description: `Created ${data.length} tasks for ${stage} stage.`
      });

      return { success: true, count: data.length };
    } catch (err) {
      console.error('Error applying playbook:', err);
      toast({
        variant: "destructive",
        title: "Failed to apply playbook",
        description: err.message
      });
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { createPlaybookTasks, loading };
};