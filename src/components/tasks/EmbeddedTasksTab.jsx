import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasksByEntity } from '@/hooks/useTasksByEntity';
import { useConfirm } from '@/context/ConfirmContext';
import TaskTable from './TaskTable';
import TaskModal from './TaskModal';

export default function EmbeddedTasksTab({ entityType, entityId }) {
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasksByEntity(entityType, entityId);
  const { confirm } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [filterState] = useState({ 
    status: [], 
    priority: [], 
    search: '', 
    sortBy: 'Due Date' 
  });

  const handleCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSave = async (taskData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleDelete = async (id) => {
     if (await confirm({ title: 'Delete Task', description: 'Are you sure you want to delete this task?' })) {
       await deleteTask(id);
     }
  };
  
  const handleMarkDone = async (id) => {
     await updateTask(id, { status: 'Done' });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Tasks & Reminders</h3>
        <Button onClick={handleCreate} size="sm" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      <TaskTable 
        tasks={tasks}
        filters={filterState}
        loading={loading}
        error={error?.message}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkDone={handleMarkDone}
      />
      
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