import React from 'react';
import TaskTable from '@/components/tasks/TaskTable'; // Reuse existing table

const TasksTab = ({ provider }) => {
   const tasks = provider?.tasks || [];
   
   // Mock handlers for now as this view is read-only in this iteration
   const noop = () => {};

   return (
      <TaskTable 
         tasks={tasks} 
         filters={{}} 
         loading={false} 
         error={null} 
         onEdit={noop} 
         onDelete={noop} 
         onMarkDone={noop} 
      />
   );
};
export default TasksTab;