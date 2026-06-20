import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import ComplianceItemTable from './ComplianceItemTable';
import ReadinessChecklistTable from './ReadinessChecklistTable';
import ComplianceItemModal from './ComplianceItemModal';
import ReadinessItemModal from './ReadinessItemModal';
import { useComplianceByProductMarketplace } from '@/hooks/useComplianceByProductMarketplace';
import { useProductMarketplaces } from '@/hooks/useProductMarketplaces';

const EmbeddedComplianceTab = ({ productId }) => {
  const [activeMarketplaceId, setActiveMarketplaceId] = useState(null);
  // Destructure getProductMarketplaces to ensure data is fetched
  const { marketplaces, getProductMarketplaces } = useProductMarketplaces(); 
  
  // Ensure data is fetched on mount
  useEffect(() => {
    if (getProductMarketplaces) {
      getProductMarketplaces();
    }
  }, [getProductMarketplaces]);

  // Filter marketplaces for THIS product only, with defensive check
  const productPMs = (marketplaces || []).filter(pm => pm.product_id === productId);
  
  // We need to fetch compliance data for ALL marketplaces of this product
  // This is a simplification. Ideally we map over each PM and show data. 
  // Or provide a selector to switch between marketplaces. 
  // Let's iterate over each assigned marketplace and show a section for it.

  return (
    <div className="space-y-8">
      {productPMs.length === 0 && (
         <div className="text-center py-10 text-slate-500">
            No marketplaces assigned to this product yet.
         </div>
      )}

      {productPMs.map(pm => (
         <ProductMarketplaceComplianceSection key={pm.id} pm={pm} />
      ))}
    </div>
  );
};

const ProductMarketplaceComplianceSection = ({ pm }) => {
   const { 
     complianceItems, 
     readinessItems, 
     loading, 
     createComplianceItem, 
     updateComplianceItem, 
     deleteComplianceItem,
     createReadinessItem,
     updateReadinessItem,
     deleteReadinessItem
   } = useComplianceByProductMarketplace(pm.id);

   const [isComplianceModalOpen, setComplianceModalOpen] = useState(false);
   const [isReadinessModalOpen, setReadinessModalOpen] = useState(false);
   const [editingItem, setEditingItem] = useState(null);
   const [editingChecklistItem, setEditingChecklistItem] = useState(null);

   const handleSaveCompliance = async (data) => {
     if (editingItem) {
       await updateComplianceItem(editingItem.id, data);
     } else {
       await createComplianceItem({ ...data, product_marketplace_id: pm.id });
     }
     setComplianceModalOpen(false);
     setEditingItem(null);
   };

   const handleSaveReadiness = async (data) => {
      if (editingChecklistItem) {
        await updateReadinessItem(editingChecklistItem.id, data);
      } else {
        await createReadinessItem({ ...data, product_marketplace_id: pm.id });
      }
      setReadinessModalOpen(false);
      setEditingChecklistItem(null);
   };

   return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
         <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <span>Marketplace: <span className="text-[hsl(var(--terracotta))]">{pm.marketplaces?.code}</span></span>
         </h3>

         <div className="space-y-6">
            {/* Compliance Section */}
            <div>
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Compliance Requirements</h4>
                  <Button size="sm" onClick={() => { setEditingItem(null); setComplianceModalOpen(true); }}>
                     <Plus className="w-4 h-4 mr-1" /> Add Requirement
                  </Button>
               </div>
               <ComplianceItemTable 
                  items={complianceItems} 
                  loading={loading}
                  onEdit={(item) => { setEditingItem(item); setComplianceModalOpen(true); }}
                  onDelete={deleteComplianceItem}
                  onMarkComplete={(item) => updateComplianceItem(item.id, { status: 'Complete' })}
               />
            </div>

            {/* Readiness Section */}
            <div>
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Launch Readiness</h4>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingChecklistItem(null); setReadinessModalOpen(true); }}>
                     <Plus className="w-4 h-4 mr-1" /> Add Checklist Item
                  </Button>
               </div>
               <ReadinessChecklistTable 
                  items={readinessItems}
                  loading={loading}
                  onEdit={(item) => { setEditingChecklistItem(item); setReadinessModalOpen(true); }}
                  onDelete={deleteReadinessItem}
                  onMarkComplete={(item) => updateReadinessItem(item.id, { status: 'Complete' })}
               />
            </div>
         </div>

         {/* Modals */}
         <ComplianceItemModal 
            isOpen={isComplianceModalOpen}
            onClose={() => setComplianceModalOpen(false)}
            onSave={handleSaveCompliance}
            initialItem={editingItem}
            loading={loading}
         />
         <ReadinessItemModal
            isOpen={isReadinessModalOpen}
            onClose={() => setReadinessModalOpen(false)}
            onSave={handleSaveReadiness}
            initialItem={editingChecklistItem}
            loading={loading}
         />
      </div>
   );
};

export default EmbeddedComplianceTab;