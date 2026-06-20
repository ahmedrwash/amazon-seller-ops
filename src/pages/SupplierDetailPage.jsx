import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import SupplierProfile from '@/components/suppliers/SupplierProfile';
import SupplierModal from '@/components/suppliers/SupplierModal';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Button } from "@/components/ui/button";
import { useConfirm } from '@/context/ConfirmContext';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSupplierById, updateSupplier, deleteSupplier, loading } = useSuppliers();
  const { confirm } = useConfirm();
  const [supplier, setSupplier] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const data = await getSupplierById(id);
      if (data) {
         setSupplier(data);
      } else {
         setError('Supplier not found');
      }
    };
    fetch();
  }, [id, getSupplierById]);

  const handleEdit = async (data) => {
     const updated = await updateSupplier(id, data);
     if (updated) setSupplier(updated);
     setEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (await confirm({
      title: 'Delete Supplier',
      description: 'Are you sure you want to delete this supplier? This will remove all associated quotes and samples.',
      variant: 'destructive'
    })) {
       await deleteSupplier(id);
       navigate('/suppliers');
    }
  };

  if (loading && !supplier) {
     return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading profile...</div>;
  }

  if (error) {
     return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
           <p>{error}</p>
           <Button onClick={() => navigate('/suppliers')}>Back to Suppliers</Button>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[hsl(var(--terracotta))]/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        <SupplierProfile 
           supplier={supplier} 
           onEdit={() => setEditModalOpen(true)}
           onDelete={handleDelete}
        />

        <SupplierModal 
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleEdit}
          initialSupplier={supplier}
          loading={loading}
        />
      </div>
    </div>
  );
}