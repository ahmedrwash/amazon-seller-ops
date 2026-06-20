import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useSupplierDocuments } from '@/hooks/useSupplierDocuments';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentTypeBadge from './DocumentTypeBadge';

const SupplierDocumentsTab = ({ supplierId }) => {
  const { documents, loading, fetchDocuments, uploadDocument, deleteDocument } = useSupplierDocuments();
  const [isModalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    if (supplierId) fetchDocuments(supplierId);
  }, [supplierId, fetchDocuments]);

  const handleUpload = async (file, data) => {
    await uploadDocument(file, data);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-medium text-slate-200">Documents</h3>
         <Button onClick={() => setModalOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            <Plus className="w-4 h-4 mr-2" /> Upload Document
         </Button>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
               <TableHead className="text-slate-300">Type</TableHead>
               <TableHead className="text-slate-300">File Name</TableHead>
               <TableHead className="text-slate-300">Uploaded</TableHead>
               <TableHead className="text-slate-300">Notes</TableHead>
               <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {documents.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={5} className="text-center py-8 text-slate-500">No documents uploaded.</TableCell>
                </TableRow>
             ) : (
                documents.map(doc => (
                   <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell><DocumentTypeBadge type={doc.doc_type} /></TableCell>
                      <TableCell className="flex items-center gap-2">
                         <FileText className="w-4 h-4 text-slate-500" />
                         <span className="truncate max-w-[200px]" title={doc.file_name}>{doc.file_name}</span>
                      </TableCell>
                      <TableCell>{doc.created_at ? format(new Date(doc.created_at), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-400">{doc.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                               <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                                  <Download className="w-4 h-4 text-slate-400 hover:text-white" />
                               </a>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteDocument(doc.id)}>
                               <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                            </Button>
                         </div>
                      </TableCell>
                   </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </div>

      <DocumentUploadModal 
         isOpen={isModalOpen}
         onClose={() => setModalOpen(false)}
         onUpload={handleUpload}
         loading={loading}
         defaultSupplierId={supplierId}
      />
    </div>
  );
};

export default SupplierDocumentsTab;