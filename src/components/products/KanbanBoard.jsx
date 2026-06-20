import React, { useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useProductMarketplaces } from '@/hooks/useProductMarketplaces'; // Keep for updates
import { useFilteredPipeline } from '@/hooks/useFilteredData'; // Use for fetching
import { PRODUCT_STAGES } from '@/constants/productConstants';
import KanbanCard from './KanbanCard';

const KanbanBoard = ({ selectedMarketplaceId }) => {
  // Use filtered hook for fetching
  const { items = [], fetchPipeline, loading } = useFilteredPipeline(selectedMarketplaceId);
  // Use original hook for actions
  const { updateStage } = useProductMarketplaces();

  useEffect(() => {
    fetchPipeline(); 
  }, [fetchPipeline, selectedMarketplaceId]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic update could happen here, but for simplicity we await
    await updateStage(draggableId, destination.droppableId);
    fetchPipeline(); // Refresh
  };

  if (loading && items.length === 0) {
    return <div className="p-10 text-center text-slate-400">Loading pipeline...</div>;
  }

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto pb-4 gap-4 h-[calc(100vh-200px)] min-w-full">
        {PRODUCT_STAGES.map(stage => {
          const stageItems = safeItems.filter(i => i.stage === stage);
          return (
            <div key={stage} className="flex-shrink-0 w-80 flex flex-col bg-slate-900/50 rounded-lg border border-slate-700/50">
               <div className="p-3 font-semibold text-slate-200 flex justify-between items-center border-b border-slate-700/50 sticky top-0 bg-slate-900/95 z-10 rounded-t-lg">
                 {stage}
                 <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                   {stageItems.length}
                 </span>
               </div>
               <Droppable droppableId={stage}>
                 {(provided, snapshot) => (
                   <div
                     {...provided.droppableProps}
                     ref={provided.innerRef}
                     className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${
                       snapshot.isDraggingOver ? 'bg-slate-800/30' : ''
                     }`}
                   >
                     {stageItems.map((item, index) => (
                       <KanbanCard key={item.id} item={item} index={index} />
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

export default KanbanBoard;