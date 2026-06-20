import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import SupplierTable from '@/components/suppliers/SupplierTable';
import SupplierCard from '@/components/suppliers/SupplierCard';
import SupplierModal from '@/components/suppliers/SupplierModal';
import { useSuppliers } from '@/hooks/useSuppliers';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/context/ConfirmContext';
import { Helmet } from 'react-helmet';

export default function SuppliersPage() {
  const { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { confirm } = useConfirm();
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (data) => {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data);
    } else {
      await createSupplier(data);
    }
    setModalOpen(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (await confirm({
      title: 'Delete Supplier',
      description: 'Are you sure you want to delete this supplier? This will remove all associated quotes and samples.',
      variant: 'destructive'
    })) {
      await deleteSupplier(id);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Suppliers - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Suppliers & Procurement</h2>
            <p className="text-slate-400 mt-1">Manage your sourcing partners and quotes</p>
         </div>
         <Button onClick={() => { setEditingSupplier(null); setModalOpen(true); }} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
           <Plus className="w-4 h-4 mr-2" /> Add Supplier
         </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input 
              placeholder="Search suppliers..." 
              className="pl-9 bg-slate-900 border-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         
         <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 px-2", viewMode === 'table' ? "bg-slate-800 text-white" : "text-slate-400")}
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 px-2", viewMode === 'grid' ? "bg-slate-800 text-white" : "text-slate-400")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
         </div>
      </div>

      {loading ? (
         <div className="text-center py-12 text-slate-400">Loading suppliers...</div>
      ) : (
         <>
           {viewMode === 'table' ? (
              <SupplierTable 
                 suppliers={filteredSuppliers} 
                 onEdit={handleEdit} 
                 onDelete={handleDelete} 
              />
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {filteredSuppliers.map(s => (
                    <SupplierCard 
                       key={s.id} 
                       supplier={s} 
                       onEdit={handleEdit} 
                       onDelete={handleDelete} 
                    />
                 ))}
              </div>
           )}
           
           {!loading && filteredSuppliers.length === 0 && (
              <div className="text-center mt-8 text-slate-500">
                 {searchTerm ? 'No suppliers found matching your search.' : ''}
              </div>
           )}
         </>
      )}

      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialSupplier={editingSupplier}
        loading={loading}
      />
    </div>
  );
}