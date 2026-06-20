import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit, Trash2 } from 'lucide-react';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';
import OverdueTaskBadge from './OverdueTaskBadge';
import { filterTasks, sortTasks } from '@/utils/taskUtils';

const TaskTable = ({
  tasks,
  filters,
  loading,
  error,
  onEdit,
  onDelete,
  onMarkDone
}) => {
  const filtered = filterTasks(tasks, filters);
  const sorted = sortTasks(filtered, filters.sortBy);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load tasks</div>;

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-300">Title</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Priority</TableHead>
            <TableHead className="text-slate-300">Due Date</TableHead>
            <TableHead className="text-slate-300">Entity</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                No tasks found matching your filters.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((task) => (
              <TableRow key={task.id} className="border-slate-700 hover:bg-slate-800/50 group">
                <TableCell className="font-medium text-slate-200">
                  <div className="flex flex-col">
                    <span>{task.title}</span>
                    {task.description && (
                      <span className="text-xs text-slate-500 truncate max-w-[200px]">{task.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell className="text-slate-300 text-sm">
                   <div className="flex items-center">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                      <OverdueTaskBadge dueDate={task.due_date} status={task.status} />
                   </div>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                   {task.entity_type !== 'General' ? task.entity_type : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status !== 'Done' && (
                       <Button variant="ghost" size="icon" onClick={() => onMarkDone(task.id)} className="h-8 w-8 text-green-400 hover:text-green-300">
                         <CheckCircle2 className="h-4 w-4" />
                       </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-8 w-8 text-blue-400 hover:text-blue-300">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskTable;