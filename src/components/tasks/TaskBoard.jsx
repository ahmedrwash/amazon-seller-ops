import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';
import { TASK_STATUSES } from '@/constants/taskConstants';
import { filterTasks } from '@/utils/taskUtils';

const TaskBoard = ({ 
  tasks, 
  filters, 
  loading, 
  error, 
  onStatusChange, 
  onEdit, 
  onDelete 
}) => {
  const filteredTasks = filterTasks(tasks, filters);

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(t => t.status === status);
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Call parent handler
    onStatusChange(draggableId, destination.droppableId);
  };

  if (loading) return <div className="text-center p-10 text-slate-500">Loading board...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error loading tasks</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto pb-4 gap-4 h-[calc(100vh-200px)] min-w-full">
        {TASK_STATUSES.map(status => {
           const columnTasks = getTasksByStatus(status);
           return (
             <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-slate-900/50 rounded-lg border border-slate-700/50">
               <div className="p-3 font-semibold text-slate-200 flex justify-between items-center border-b border-slate-700/50">
                 {status}
                 <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                   {columnTasks.length}
                 </span>
               </div>
               <Droppable droppableId={status}>
                 {(provided, snapshot) => (
                   <div
                     {...provided.droppableProps}
                     ref={provided.innerRef}
                     className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${
                       snapshot.isDraggingOver ? 'bg-slate-800/30' : ''
                     }`}
                   >
                     {columnTasks.map((task, index) => (
                       <TaskCard 
                         key={task.id} 
                         task={task} 
                         index={index} 
                         onEdit={onEdit}
                         onDelete={onDelete}
                       />
                     ))}
                     {provided.placeholder}
                   </div>
                 )}
               </Droppable>
             </div>
           );
        })}
      </div>
    </DragDropContext>
  );
};

export default TaskBoard;