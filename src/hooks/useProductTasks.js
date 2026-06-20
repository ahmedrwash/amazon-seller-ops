import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useProductTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getTasks = useCallback(async (productId, filters = {}) => {
    try {
      setLoading(true);
      let query = supabase
        .from('product_tasks')
        .select('*')
        .eq('product_id', productId)
        .order('due_date', { ascending: true });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch tasks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTask = async (data) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('product_tasks')
        .insert([data]);

      if (error) throw error;
      toast({ title: 'Success', description: 'Task created' });
      if (data.product_id) getTasks(data.product_id);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, data) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('product_tasks')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Task updated' });
      // Optimistic update or refresh
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('product_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Task deleted' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markTaskDone = async (id) => {
    return updateTask(id, { status: 'Done' });
  };

  return {
    tasks,
    loading,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    markTaskDone
  };
};