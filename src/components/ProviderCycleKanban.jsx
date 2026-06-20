import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PROVIDER_STAGES } from '@/constants/providerPlaybooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Star, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { getNextFollowUpDate, getLastCommunicationDate, getProviderServiceAreas } from '@/utils/providerAggregationUtils';
import { format } from 'date-fns';

const STAGE_COLORS = {
  [PROVIDER_STAGES.LEAD]: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  [PROVIDER_STAGES.SHORTLISTED]: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  [PROVIDER_STAGES.EVALUATION]: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  [PROVIDER_STAGES.CONTRACTING]: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  [PROVIDER_STAGES.ACTIVE]: 'bg-green-500/10 border-green-500/20 text-green-400',
  [PROVIDER_STAGES.PAUSED]: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  [PROVIDER_STAGES.RENEWAL_REVIEW]: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  [PROVIDER_STAGES.REJECTED]: 'bg-red-500/10 border-red-500/20 text-red-400',
  [PROVIDER_STAGES.EXITED]: 'bg-slate-800 border-slate-700 text-slate-500',
};

const ProviderCard = ({ provider, index }) => {
  const navigate = useNavigate();
  const nextFollowUp = getNextFollowUpDate(provider.provider_communications);
  const lastComm = getLastCommunicationDate(provider.provider_communications);
  const serviceAreas = getProviderServiceAreas(provider.provider_services);
  
  const isOverdue = nextFollowUp && new Date(nextFollowUp) < new Date();

  return (
    <Draggable draggableId={provider.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          onClick={() => navigate(`/provider-cycle/${provider.id}`)}
        >
          <Card className={`bg-slate-800 border-slate-700 hover:border-[hsl(var(--terracotta))]/50 hover:shadow-lg transition-all cursor-pointer ${isOverdue ? 'border-red-500/50' : ''}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-100 truncate pr-2">{provider.provider_name}</h4>
                {provider.risk_level === 'High' || provider.risk_level === 'Critical' ? (
                   <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : null}
              </div>
              
              <div className="flex flex-wrap gap-1">
                 <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{provider.provider_type}</Badge>
                 {provider.internal_rating > 0 && (
                   <div className="flex items-center text-yellow-500 text-xs">
                     <Star className="w-3 h-3 fill-current mr-0.5" />
                     {provider.internal_rating}
                   </div>
                 )}
              </div>

              {serviceAreas.length > 0 && (
                <div className="text-xs text-slate-500 truncate">
                  {serviceAreas.join(', ')}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                 <div className="flex items-center gap-1" title="Last Communication">
                    <RefreshCw className="w-3 h-3" />
                    {lastComm ? format(new Date(lastComm), 'MMM d') : '-'}
                 </div>
                 <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : ''}`} title="Next Follow-up">
                    <Calendar className="w-3 h-3" />
                    {nextFollowUp ? format(new Date(nextFollowUp), 'MMM d') : '-'}
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

const ProviderCycleKanban = ({ groupedProviders, onDragEnd }) => {
  const stages = Object.values(PROVIDER_STAGES);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full overflow-x-auto gap-4 pb-4">
        {stages.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800/50">
             <div className={`p-3 border-b border-slate-800 rounded-t-xl sticky top-0 bg-slate-900 z-10 flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]?.split(' ')[0].replace('/10', '') || 'bg-slate-500'}`}></div>
                   <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide">{stage}</h3>
                </div>
                <Badge variant="secondary" className="bg-slate-800 text-slate-400">{groupedProviders[stage]?.length || 0}</Badge>
             </div>
             
             <Droppable droppableId={stage}>
               {(provided) => (
                 <div
                   ref={provided.innerRef}
                   {...provided.droppableProps}
                   className="p-3 flex-1 overflow-y-auto min-h-[200px]"
                 >
                   {groupedProviders[stage]?.map((provider, index) => (
                     <ProviderCard key={provider.id} provider={provider} index={index} />
                   ))}
                   {provided.placeholder}
                 </div>
               )}
             </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default ProviderCycleKanban;