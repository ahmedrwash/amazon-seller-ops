import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import RatingStars from './RatingStars';
import SupplierQuotesTab from './SupplierQuotesTab';
import SupplierSamplesTab from './SupplierSamplesTab';
import SupplierDocumentsTab from './SupplierDocumentsTab';

const SupplierProfile = ({ supplier, onEdit, onDelete }) => {
  const navigate = useNavigate();

  if (!supplier) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
         <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
               <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
               <h1 className="text-3xl font-bold text-white mb-2">{supplier.name}</h1>
               <div className="flex flex-wrap gap-4 text-slate-400 text-sm">
                  {supplier.country && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {supplier.country}</div>}
                  {supplier.website && <div className="flex items-center gap-1"><Globe className="w-4 h-4" /> <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--terracotta))]">{supplier.website}</a></div>}
                  {supplier.rating > 0 && <RatingStars rating={supplier.rating} readonly />}
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={onEdit}>
               <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
            <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-900/20" onClick={onDelete}>
               <Trash2 className="w-4 h-4" />
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Sidebar / Overview Card */}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
               <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
               <div className="space-y-4">
                  <div>
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Contact Person</span>
                     <p className="text-slate-200">{supplier.contact_name || '-'}</p>
                  </div>
                  <div>
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Email</span>
                     <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a href={`mailto:${supplier.email}`} className="text-[hsl(var(--terracotta))] hover:underline truncate">{supplier.email || '-'}</a>
                     </div>
                  </div>
                   <div>
                     <span className="text-xs text-slate-500 uppercase tracking-wider">Phone</span>
                     <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-200">{supplier.phone || '-'}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
               <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
               <p className="text-slate-300 whitespace-pre-wrap text-sm">{supplier.notes || 'No notes available.'}</p>
            </div>
         </div>

         {/* Main Content Tabs */}
         <div className="lg:col-span-2">
            <Tabs defaultValue="quotes" className="w-full">
               <TabsList className="bg-slate-900 border border-slate-700 w-full justify-start mb-4">
                  <TabsTrigger value="quotes" className="data-[state=active]:bg-[hsl(var(--terracotta))]">Quotes</TabsTrigger>
                  <TabsTrigger value="samples" className="data-[state=active]:bg-[hsl(var(--terracotta))]">Samples</TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-[hsl(var(--terracotta))]">Documents</TabsTrigger>
               </TabsList>
               
               <TabsContent value="quotes">
                  <SupplierQuotesTab supplierId={supplier.id} />
               </TabsContent>
               <TabsContent value="samples">
                  <SupplierSamplesTab supplierId={supplier.id} />
               </TabsContent>
               <TabsContent value="documents">
                  <SupplierDocumentsTab supplierId={supplier.id} />
               </TabsContent>
            </Tabs>
         </div>
      </div>
    </div>
  );
};

export default SupplierProfile;