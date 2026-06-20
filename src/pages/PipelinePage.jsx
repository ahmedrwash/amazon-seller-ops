import React from 'react';
import { Helmet } from 'react-helmet';
import KanbanBoard from '@/components/products/KanbanBoard';
import { useMarketplaceContext } from '@/contexts/MarketplaceContext';

const PipelinePage = () => {
  const { selectedMarketplaceId } = useMarketplaceContext();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <Helmet>
        <title>Pipeline - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Product Pipeline</h2>
        <p className="text-slate-400">Manage product lifecycle stages</p>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
         <KanbanBoard selectedMarketplaceId={selectedMarketplaceId} />
      </div>
    </div>
  );
};

export default PipelinePage;