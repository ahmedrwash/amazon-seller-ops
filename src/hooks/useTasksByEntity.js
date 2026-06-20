import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

// Helper to clean UUID fields
const sanitizeTaskData = (data) => {
  const cleaned = { ...data };
  const uuidFields = ['marketplace_id', 'owner', 'entity_id'];
  
  uuidFields.forEach(field => {
    if (cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  return cleaned;
};

export const useTasksByEntity = (entityType, entityId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchEntityTasks = useCallback(async () => {
    if (!entityId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('due_date', { ascending: true });

      if (err) throw err;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      setError(err);
      toast({ title: 'Error', description: 'Failed to fetch tasks for this entity', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, toast]);

  useEffect(() => {
    fetchEntityTasks();
  }, [fetchEntityTasks]);

  const createTask = async (taskData) => {
    try {
      const cleanedData = sanitizeTaskData(taskData);
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          ...cleanedData, 
          entity_type: entityType, 
          entity_id: entityId,
          created_by: session.user.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Task added' });
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const cleanedUpdates = sanitizeTaskData(updates);
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...cleanedUpdates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Task updated' });
      setTasks(prev => prev.map(t => t.id === id ? data : t));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteTask = async (id) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Task deleted' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchEntityTasks
  };
};