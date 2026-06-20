import React from 'react';
import { FileText } from 'lucide-react';

const DocumentsTab = ({ provider }) => {
   const docs = provider?.provider_documents || [];

   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
         {docs.length === 0 ? (
            <div className="col-span-full text-center p-8 text-slate-500 bg-slate-800 rounded border border-slate-700">
               No documents uploaded.
            </div>
         ) : (
            docs.map(doc => (
               <div key={doc.id} className="bg-slate-800 p-4 rounded border border-slate-700 hover:border-[hsl(var(--terracotta))]/50 transition-colors">
                  <FileText className="w-8 h-8 text-[hsl(var(--terracotta))] mb-2" />
                  <p className="font-medium text-white truncate">{doc.file_name}</p>
                  <p className="text-xs text-slate-500">{doc.doc_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
               </div>
            ))
         )}
      </div>
   );
};
export default DocumentsTab;