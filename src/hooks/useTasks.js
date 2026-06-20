import { useState, useCallback } from 'react';
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

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchTasks = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase.from('tasks').select('*');

      query = query.order('created_at', { ascending: false });

      const { data, error: err } = await query;
      if (err) throw err;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err);
      toast({ title: 'Error', description: 'Failed to fetch tasks', variant: 'destructive' });
      setTasks([]); // Ensure array on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTask = async (taskData) => {
    try {
      const cleanedData = sanitizeTaskData(taskData);
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...cleanedData, created_by: session.user.id }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Task created successfully' });
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error(err);
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
      toast({ title: 'Success', description: 'Task updated successfully' });
      setTasks(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Task deleted' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const markTaskAsDone = async (id) => {
    return updateTask(id, { status: 'Done' });
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    markTaskAsDone
  };
};