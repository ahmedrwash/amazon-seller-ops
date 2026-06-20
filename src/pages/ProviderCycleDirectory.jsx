import React, { useState } from 'react';
import { useProviderCycleDirectory } from '@/hooks/useProviderCycleDirectory';
import { useProviderStageTransition } from '@/hooks/useProviderStageTransition';
import ProviderCycleKanban from '@/components/ProviderCycleKanban';
import ProviderCycleList from '@/components/ProviderCycleList';
import ProviderCycleFilters from '@/components/ProviderCycleFilters';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const ProviderCycleDirectory = () => {
  const [viewMode, setViewMode] = useState('kanban');
  const [filters, setFilters] = useState({});
  const { providers, groupedProviders, loading, error } = useProviderCycleDirectory(filters);
  const { moveProviderToStage } = useProviderStageTransition();
  const navigate = useNavigate();

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const provider = providers.find(p => p.id === draggableId);
    if (!provider) return;

    await moveProviderToStage(provider, destination.droppableId, 'Moved via Kanban Board');
    window.location.reload(); 
  };

  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <Helmet>
        <title>Provider Cycle - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Provider Cycle Management</h1>
          <p className="text-slate-400">Manage provider lifecycle from lead to exit</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
           <Button 
             variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
             size="sm" 
             onClick={() => setViewMode('kanban')}
             className="text-xs"
           >
             <LayoutGrid className="w-4 h-4 mr-2" /> Kanban
           </Button>
           <Button 
             variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
             size="sm" 
             onClick={() => setViewMode('list')}
             className="text-xs"
           >
             <ListIcon className="w-4 h-4 mr-2" /> List
           </Button>
        </div>
      </div>

      <div className="mb-6">
        <ProviderCycleFilters onFilterChange={setFilters} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {viewMode === 'kanban' ? (
             <ProviderCycleKanban groupedProviders={groupedProviders} onDragEnd={handleDragEnd} />
          ) : (
             <ProviderCycleList providers={providers} />
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderCycleDirectory;