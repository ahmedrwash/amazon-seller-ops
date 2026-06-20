import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, LayoutList, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskFilter from '@/components/tasks/TaskFilter';
import TaskTable from '@/components/tasks/TaskTable';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskModal from '@/components/tasks/TaskModal';
import { useTasks } from '@/hooks/useTasks';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { useConfirm } from '@/context/ConfirmContext';
import { getTaskCountByStatus } from '@/utils/taskUtils';

export default function TasksPage() {
  const { 
    tasks, 
    loading, 
    error, 
    fetchTasks, 
    createTask, 
    updateTask, 
    deleteTask,
    markTaskAsDone 
  } = useTasks();
  
  const { filters, updateFilter, resetFilters } = useTaskFilters();
  const { confirm } = useConfirm();
  const [viewMode, setViewMode] = useState('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = getTaskCountByStatus(tasks);

  const handleAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete Task', description: 'Are you sure you want to delete this task?' })) {
      await deleteTask(id);
    }
  };

  const handleSave = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    setIsModalOpen(false);
  };
  
  const handleStatusChange = async (taskId, newStatus) => {
     await updateTask(taskId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Tasks - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Task Management</h2>
          <p className="text-slate-400">
            {stats.Total || 0} Total • {stats.Open || 0} Open • {stats['In Progress'] || 0} In Progress
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <Tabs value={viewMode} onValueChange={setViewMode} className="hidden md:block">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="list"><LayoutList className="h-4 w-4 mr-2"/> List</TabsTrigger>
              <TabsTrigger value="board"><Kanban className="h-4 w-4 mr-2"/> Board</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleAdd} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      <TaskFilter 
        filters={filters} 
        onFilterChange={updateFilter} 
        onReset={resetFilters} 
      />

      {viewMode === 'list' ? (
        <TaskTable 
          tasks={tasks} 
          filters={filters} 
          loading={loading} 
          error={error?.message}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkDone={markTaskAsDone}
        />
      ) : (
        <TaskBoard 
          tasks={tasks} 
          filters={filters} 
          loading={loading} 
          error={error?.message}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <TaskModal 
        isOpen={isModalOpen}
        task={editingTask}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}