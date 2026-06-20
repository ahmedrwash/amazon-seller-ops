import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, User, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import TaskPriorityBadge from './TaskPriorityBadge';
import OverdueTaskBadge from './OverdueTaskBadge';
import { formatRelativeDate } from '@/utils/taskUtils';
import { cn } from '@/lib/utils';

const TaskCard = ({ task, index, onEdit, onDelete }) => {
  
  const handleEditClick = () => {
    // Ensure we pass clean data to the edit modal
    const cleanTask = {
      ...task,
      marketplace_id: task.marketplace_id || null,
      owner: task.owner || null,
      entity_id: task.entity_id || null
    };
    onEdit(cleanTask);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 bg-slate-800 border-slate-700 shadow-sm hover:shadow-md transition-shadow group relative",
            snapshot.isDragging && "opacity-90 ring-2 ring-[hsl(var(--terracotta))] z-50 rotate-2"
          )}
        >
          <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start space-y-0">
             <div className="flex flex-wrap gap-2 mb-2 w-full pr-6">
                <TaskPriorityBadge priority={task.priority} />
                {task.entity_type !== 'General' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase font-bold tracking-wider">
                    {task.entity_type}
                  </span>
                )}
                <OverdueTaskBadge dueDate={task.due_date} status={task.status} />
             </div>
             
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 absolute top-2 right-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-400 focus:text-red-400">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <CardTitle className="text-sm font-medium text-slate-200 leading-snug mb-1 line-clamp-2">
              {task.title}
            </CardTitle>
            {task.description && (
              <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
            )}
          </CardContent>
          <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-slate-500">
            {task.due_date && (
               <div className="flex items-center gap-1">
                 <Calendar className="h-3 w-3" />
                 <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
               </div>
            )}
            {task.owner && (
               <div className="flex items-center gap-1 ml-auto" title="Assigned Owner">
                 <User className="h-3 w-3" />
               </div>
            )}
          </CardFooter>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskCard;