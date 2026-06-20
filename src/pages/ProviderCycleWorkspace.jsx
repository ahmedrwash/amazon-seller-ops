import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProviderCycle } from '@/hooks/useProviderCycle';
import { useProviderStageTransition } from '@/hooks/useProviderStageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProviderStageModal from '@/components/ProviderStageModal';
import { useAuthorization } from '@/hooks/useAuthorization';

// Tab Components (Imports)
import CycleOverviewTab from '@/components/CycleOverviewTab';
import EvaluationTab from '@/components/EvaluationTab';
import ContractingTab from '@/components/ContractingTab';
import PerformanceTab from '@/components/PerformanceTab';
import CommunicationsTab from '@/components/CommunicationsTab';
import DocumentsTab from '@/components/DocumentsTab';
import TasksTab from '@/components/TasksTab';
import { parseCycleMetadata } from '@/utils/cycleMetadataUtils';

const ProviderCycleWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: provider, loading, error, refetch } = useProviderCycle(id);
  const { moveProviderToStage } = useProviderStageTransition();
  const { isAdmin, isOps } = useAuthorization(); // Simplified for now
  
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  
  const canEdit = isAdmin || isOps;

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading workspace</div>;
  if (!provider) return <div className="p-8 text-center text-slate-500">Provider not found</div>;

  const metadata = parseCycleMetadata(provider.notes);

  const handleStageChange = async (newStage, notes) => {
    await moveProviderToStage(provider, newStage, notes);
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-20 backdrop-blur-sm">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={() => navigate('/provider-cycle')} className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
               </Button>
               <div>
                  <h1 className="text-xl font-bold flex items-center gap-3">
                     {provider.provider_name}
                     <Badge className="bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] border-[hsl(var(--terracotta))]/20">{provider.status}</Badge>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                     Last updated: {new Date(provider.updated_at).toLocaleString()}
                  </p>
               </div>
            </div>
            {canEdit && (
               <Button onClick={() => setIsStageModalOpen(true)} variant="outline" className="border-slate-700 hover:bg-slate-800">
                  Change Stage
               </Button>
            )}
         </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6">
         <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 w-full justify-start overflow-x-auto">
               <TabsTrigger value="overview">Cycle Overview</TabsTrigger>
               <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
               <TabsTrigger value="contracting">Contracting</TabsTrigger>
               <TabsTrigger value="performance">Performance</TabsTrigger>
               <TabsTrigger value="comms">Communications</TabsTrigger>
               <TabsTrigger value="docs">Documents</TabsTrigger>
               <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
               <CycleOverviewTab provider={provider} metadata={metadata} refetch={refetch} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="evaluation">
               <EvaluationTab provider={provider} metadata={metadata} refetch={refetch} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="contracting">
               <ContractingTab provider={provider} metadata={metadata} refetch={refetch} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="performance">
               <PerformanceTab provider={provider} metadata={metadata} refetch={refetch} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="comms">
               <CommunicationsTab provider={provider} />
            </TabsContent>
            <TabsContent value="docs">
               <DocumentsTab provider={provider} canEdit={canEdit} refetch={refetch} />
            </TabsContent>
            <TabsContent value="tasks">
               <TasksTab provider={provider} canEdit={canEdit} refetch={refetch} />
            </TabsContent>
         </Tabs>
      </div>

      <ProviderStageModal 
         isOpen={isStageModalOpen} 
         onClose={() => setIsStageModalOpen(false)} 
         currentStage={provider.status}
         onConfirm={handleStageChange}
      />
    </div>
  );
};

export default ProviderCycleWorkspace;