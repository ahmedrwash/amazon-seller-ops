import React, { useState, useEffect } from 'react';
import { useListingByProductMarketplace } from '@/hooks/useListingByProductMarketplace';
import { useListingBriefs } from '@/hooks/useListingBriefs';
import { useCreativeAssets } from '@/hooks/useCreativeAssets';
import ListingStatusBadge from './ListingStatusBadge';
import CompletionProgressBar from './CompletionProgressBar';
import ListingChecklist from './ListingChecklist';
import AssetCard from './AssetCard';
import { Button } from "@/components/ui/button";
import { Plus, Edit } from 'lucide-react';
import ListingBriefModal from './ListingBriefModal';
import UploadAssetModal from './UploadAssetModal';
import { calculateCompletionPercentage } from '@/utils/listingUtils';

const ListingTab = ({ productMarketplaceId }) => {
  const { brief, assets, checklist, loading, refetch } = useListingByProductMarketplace(productMarketplaceId);
  const { createListingBrief, updateListingBrief } = useListingBriefs();
  const { uploadAsset, updateAsset, deleteAsset } = useCreativeAssets();

  const [isBriefModalOpen, setBriefModalOpen] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);

  // Generate a mock checklist if none exists (for prototype)
  const checklistItems = checklist.length > 0 ? checklist : [
     { id: 1, item: 'Title written', status: brief?.title ? 'Complete' : 'Pending', required: true },
     { id: 2, item: 'Bullets (5)', status: brief?.bullets?.filter(b=>b).length >= 5 ? 'Complete' : 'Pending', required: true },
     { id: 3, item: 'Main Image', status: assets.some(a=>a.asset_type === 'Main Image') ? 'Complete' : 'Pending', required: true },
     { id: 4, item: 'Listing Approved', status: brief?.status === 'Approved' ? 'Complete' : 'Pending', required: true }
  ];

  const completion = calculateCompletionPercentage(checklistItems);

  const handleSaveBrief = async (data) => {
    if (brief) {
      await updateListingBrief(brief.id, data);
    } else {
      await createListingBrief({ ...data, product_marketplace_id: productMarketplaceId });
    }
    setBriefModalOpen(false);
    refetch();
  };

  const handleUploadAsset = async (file, data) => {
    await uploadAsset(file, { ...data, product_marketplace_id: productMarketplaceId });
    setUploadModalOpen(false);
    refetch();
  };

  if (!productMarketplaceId) return <div className="text-slate-400 p-4">Select a marketplace first.</div>;
  if (loading && !brief) return <div className="text-slate-400 p-4">Loading listing data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brief & Checklist */}
        <div className="space-y-6 lg:col-span-2">
           {/* Brief Section */}
           <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-semibold text-white">Listing Brief</h3>
                    <p className="text-sm text-slate-400">Content and SEO optimization</p>
                 </div>
                 {brief && <ListingStatusBadge status={brief.status} />}
              </div>

              {brief ? (
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs text-slate-500 uppercase">Title</label>
                       <p className="text-slate-200 font-medium line-clamp-2">{brief.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs text-slate-500 uppercase">SEO Score</label>
                          <p className="text-xl font-bold text-[hsl(var(--terracotta))]">{brief.seo_score}/100</p>
                       </div>
                       <div>
                          <label className="text-xs text-slate-500 uppercase">Keywords</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                             {brief.keywords?.slice(0,3).map((k, i) => (
                                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{k}</span>
                             ))}
                             {(brief.keywords?.length || 0) > 3 && <span className="text-xs text-slate-500">+{brief.keywords.length - 3} more</span>}
                          </div>
                       </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setBriefModalOpen(true)} className="w-full mt-2">
                       <Edit className="w-4 h-4 mr-2" /> Edit Brief
                    </Button>
                 </div>
              ) : (
                 <div className="text-center py-8 border border-dashed border-slate-800 rounded">
                    <p className="text-slate-500 mb-2">No listing brief created yet.</p>
                    <Button onClick={() => setBriefModalOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                       <Plus className="w-4 h-4 mr-2" /> Create Brief
                    </Button>
                 </div>
              )}
           </div>

           {/* Assets Section */}
           <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-white">Creative Assets</h3>
                 <Button size="sm" onClick={() => setUploadModalOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                    <Plus className="w-4 h-4 mr-1" /> Upload
                 </Button>
              </div>
              
              {assets.length === 0 ? (
                 <p className="text-slate-500 text-sm text-center py-8">No assets uploaded.</p>
              ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {assets.map(asset => (
                       <AssetCard 
                          key={asset.id} 
                          asset={asset} 
                          onDelete={async (id) => { await deleteAsset(id); refetch(); }}
                          onApprove={async (asset) => { await updateAsset(asset.id, { status: 'Approved' }); refetch(); }}
                          onReject={async (asset) => { await updateAsset(asset.id, { status: 'Rejected' }); refetch(); }}
                       />
                    ))}
                 </div>
              )}
           </div>
        </div>

        {/* Right Column: Status & Checklist */}
        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Completion Status</h3>
              <div className="mb-6">
                 <CompletionProgressBar percentage={completion} />
              </div>
              <ListingChecklist items={checklistItems} />
           </div>
        </div>
      </div>

      <ListingBriefModal 
         isOpen={isBriefModalOpen}
         onClose={() => setBriefModalOpen(false)}
         onSave={handleSaveBrief}
         initialBrief={brief}
      />

      <UploadAssetModal 
         isOpen={isUploadModalOpen}
         onClose={() => setUploadModalOpen(false)}
         onUpload={handleUploadAsset}
         productMarketplaceId={productMarketplaceId}
      />
    </div>
  );
};

export default ListingTab;