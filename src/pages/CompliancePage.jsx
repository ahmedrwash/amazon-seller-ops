import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import ComplianceSummaryCards from '@/components/compliance/ComplianceSummaryCards';
import ComplianceFilter from '@/components/compliance/ComplianceFilter';
import ComplianceItemTable from '@/components/compliance/ComplianceItemTable';
import ReadinessChecklistTable from '@/components/compliance/ReadinessChecklistTable';
import ComplianceItemModal from '@/components/compliance/ComplianceItemModal';
import ReadinessItemModal from '@/components/compliance/ReadinessItemModal';
import { useComplianceItems } from '@/hooks/useComplianceItems';
import { useReadinessChecklist } from '@/hooks/useReadinessChecklist';
import { Helmet } from 'react-helmet';

const CompliancePage = () => {
  const { 
    items: complianceItems, 
    fetchComplianceItems, 
    loading: complianceLoading,
    createComplianceItem,
    updateComplianceItem,
    deleteComplianceItem 
  } = useComplianceItems();

  const { 
    items: readinessItems, 
    fetchReadinessItems, 
    loading: readinessLoading,
    createReadinessItem,
    updateReadinessItem,
    deleteReadinessItem
  } = useReadinessChecklist();

  const [filters, setFilters] = useState({});
  const [isComplianceModalOpen, setComplianceModalOpen] = useState(false);
  const [isReadinessModalOpen, setReadinessModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);

  useEffect(() => {
    fetchComplianceItems(filters);
    fetchReadinessItems(filters);
  }, [filters, fetchComplianceItems, fetchReadinessItems]);

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({});
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSaveCompliance = async (data) => {
    if (editingItem) {
      await updateComplianceItem(editingItem.id, data);
    } else {
      await createComplianceItem(data);
    }
    setComplianceModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveReadiness = async (data) => {
    if (editingChecklistItem) {
      await updateReadinessItem(editingChecklistItem.id, data);
    } else {
      await createReadinessItem(data);
    }
    setReadinessModalOpen(false);
    setEditingChecklistItem(null);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Compliance - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Compliance & Readiness</h2>
            <p className="text-slate-400 mt-1">Manage regulatory requirements and launch checklists</p>
         </div>
         <div className="flex gap-2">
            <Button onClick={() => { setEditingItem(null); setComplianceModalOpen(true); }} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
              <Plus className="w-4 h-4 mr-2" /> Add Requirement
            </Button>
         </div>
      </div>

      <ComplianceSummaryCards complianceItems={complianceItems} readinessItems={readinessItems} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1">
            <ComplianceFilter filters={filters} onFilterChange={handleFilterChange} />
         </div>
         <div className="lg:col-span-3">
            <Tabs defaultValue="compliance" className="w-full">
               <TabsList className="bg-slate-900 border border-slate-700 w-full justify-start">
                  <TabsTrigger value="compliance" className="data-[state=active]:bg-[hsl(var(--terracotta))]">Compliance Items</TabsTrigger>
                  <TabsTrigger value="readiness" className="data-[state=active]:bg-[hsl(var(--terracotta))]">Readiness Checklist</TabsTrigger>
               </TabsList>
               
               <TabsContent value="compliance" className="mt-4">
                  <ComplianceItemTable 
                     items={complianceItems} 
                     loading={complianceLoading}
                     onEdit={(item) => { setEditingItem(item); setComplianceModalOpen(true); }}
                     onDelete={deleteComplianceItem}
                     onMarkComplete={(item) => updateComplianceItem(item.id, { status: 'Complete' })}
                  />
               </TabsContent>
               
               <TabsContent value="readiness" className="mt-4">
                  <div className="flex justify-end mb-4">
                     <Button size="sm" variant="outline" onClick={() => { setEditingChecklistItem(null); setReadinessModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Checklist Item
                     </Button>
                  </div>
                  <ReadinessChecklistTable 
                     items={readinessItems}
                     loading={readinessLoading}
                     onEdit={(item) => { setEditingChecklistItem(item); setReadinessModalOpen(true); }}
                     onDelete={deleteReadinessItem}
                     onMarkComplete={(item) => updateReadinessItem(item.id, { status: 'Complete' })}
                  />
               </TabsContent>
            </Tabs>
         </div>
      </div>

      <ComplianceItemModal 
        isOpen={isComplianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        onSave={handleSaveCompliance}
        initialItem={editingItem}
        loading={complianceLoading}
      />
      
      <ReadinessItemModal
        isOpen={isReadinessModalOpen}
        onClose={() => setReadinessModalOpen(false)}
        onSave={handleSaveReadiness}
        initialItem={editingChecklistItem}
        loading={readinessLoading}
      />
    </div>
  );
};

export default CompliancePage;