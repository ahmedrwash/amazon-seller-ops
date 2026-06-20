import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useSupplierSamples } from '@/hooks/useSupplierSamples';
import SampleModal from './SampleModal';
import SampleStatusBadge from './SampleStatusBadge';
import RatingStars from './RatingStars';

const SupplierSamplesTab = ({ supplierId }) => {
  const { samples, loading, fetchSamples, createSample, updateSample } = useSupplierSamples();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSample, setEditingSample] = useState(null);

  React.useEffect(() => {
    if (supplierId) fetchSamples(supplierId);
  }, [supplierId, fetchSamples]);

  const handleSave = async (data) => {
    if (editingSample) {
      await updateSample(editingSample.id, data);
    } else {
      await createSample(data);
    }
    setModalOpen(false);
    setEditingSample(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-medium text-slate-200">Samples</h3>
         <Button onClick={() => { setEditingSample(null); setModalOpen(true); }} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            <Plus className="w-4 h-4 mr-2" /> Request Sample
         </Button>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
               <TableHead className="text-slate-300">Product</TableHead>
               <TableHead className="text-slate-300">Date</TableHead>
               <TableHead className="text-slate-300">Status</TableHead>
               <TableHead className="text-slate-300">Quality</TableHead>
               <TableHead className="text-slate-300">Feedback</TableHead>
               <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {samples.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-slate-500">No samples requested yet.</TableCell>
                </TableRow>
             ) : (
                samples.map(sample => (
                   <TableRow key={sample.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-200">{sample.products?.product_name}</TableCell>
                      <TableCell>{sample.sample_date ? format(new Date(sample.sample_date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell><SampleStatusBadge status={sample.status} /></TableCell>
                      <TableCell>
                         {sample.quality_rating > 0 ? <RatingStars rating={sample.quality_rating} readonly size="sm" /> : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-400" title={sample.feedback}>{sample.feedback || '-'}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="sm" onClick={() => { setEditingSample(sample); setModalOpen(true); }}>Edit</Button>
                      </TableCell>
                   </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </div>

      <SampleModal 
         isOpen={isModalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleSave}
         initialSample={editingSample}
         loading={loading}
         defaultSupplierId={supplierId}
      />
    </div>
  );
};

export default SupplierSamplesTab;