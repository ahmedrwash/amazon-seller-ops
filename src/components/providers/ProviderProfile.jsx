import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServices, useDocuments, useCommunications, useUpdateProvider, useDeleteProvider } from '@/hooks/useServiceProviders';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CommunicationForm from './CommunicationForm';
import DocumentUpload from './DocumentUpload';
import ServiceForm from './ServiceForm';
import EmbeddedTasksTab from '@/components/tasks/EmbeddedTasksTab';

const ProviderProfile = ({ provider }) => {
  const { updateProvider } = useUpdateProvider();
  const { deleteProvider } = useDeleteProvider();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { services, deleteService, loading: servicesLoading } = useServices(provider?.id);
  const { documents, deleteDocument, loading: docsLoading } = useDocuments(provider?.id);
  const { communications, loading: commsLoading } = useCommunications(provider?.id);

  if (!provider) {
      return <div className="p-6 text-center text-slate-400">Provider data unavailable.</div>;
  }

  const handleDeleteProvider = async () => {
    try {
      const { error } = await deleteProvider(provider.id);
      if (error) throw error;
      
      toast({ title: 'Provider deleted' });
      navigate('/providers');
    } catch (error) {
      toast({ 
        title: 'Error deleting provider', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-800 text-slate-400 border-b border-slate-700 w-full justify-start rounded-none p-0 h-auto flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--terracotta))] data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none py-3 px-6">Overview</TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--terracotta))] data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none py-3 px-6">Tasks</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--terracotta))] data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none py-3 px-6">Services</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--terracotta))] data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none py-3 px-6">Documents</TabsTrigger>
          <TabsTrigger value="communications" className="data-[state=active]:bg-transparent data-[state=active]:text-[hsl(var(--terracotta))] data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none py-3 px-6">Communications</TabsTrigger>
        </TabsList>

        <div className="p-6 bg-slate-800/50 min-h-[400px]">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="space-y-3 text-slate-300">
                  <p><span className="text-slate-500">Legal Name:</span> {provider.company_legal_name || '-'}</p>
                  <p><span className="text-slate-500">Email:</span> {provider.primary_contact_email}</p>
                  <p><span className="text-slate-500">Phone:</span> {provider.primary_contact_phone || '-'}</p>
                  <p><span className="text-slate-500">Website:</span> {provider.website || '-'}</p>
                  <p><span className="text-slate-500">Location:</span> {provider.country} ({provider.time_zone})</p>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Internal Status</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500 uppercase">Notes</Label>
                    <p className="text-slate-300 bg-slate-900/50 p-3 rounded mt-1">{provider.notes || 'No notes added.'}</p>
                  </div>
                  <div className="flex justify-end pt-4">
                     <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} size="sm">Delete Provider</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-0">
             <EmbeddedTasksTab entityType="Provider" entityId={provider.id} />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Services Offered</h3>
              <Button onClick={() => setIsServiceModalOpen(true)} size="sm" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Add Service</Button>
            </div>
            {servicesLoading ? (
                <div className="text-slate-400 text-center py-4">Loading services...</div>
            ) : (
                <div className="space-y-4">
                {services && services.map(s => (
                    <div key={s.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-white">{s.service_area}</h4>
                        <p className="text-sm text-slate-400">{s.details}</p>
                        <p className="text-xs text-slate-500 mt-2">Price: {s.price_range} ({s.pricing_model})</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteService(s.id)} className="text-red-400 hover:text-red-300">Delete</Button>
                    </div>
                ))}
                {(!services || services.length === 0) && <p className="text-slate-500">No services listed.</p>}
                </div>
            )}
            <ServiceForm isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} providerId={provider.id} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Documents</h3>
              <Button onClick={() => setIsDocModalOpen(true)} size="sm" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Upload</Button>
            </div>
            {docsLoading ? (
                <div className="text-slate-400 text-center py-4">Loading documents...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {documents && documents.map(doc => (
                    <div key={doc.id} className="bg-slate-800 p-4 rounded border border-slate-700 hover:border-[hsl(var(--terracotta))]/50 transition-colors">
                    <div className="flex items-start justify-between">
                        <FileText className="w-8 h-8 text-[hsl(var(--terracotta))] mb-2" />
                        <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400">×</Button>
                    </div>
                    <p className="font-medium text-white truncate">{doc.file_name}</p>
                    <p className="text-xs text-slate-500">{doc.doc_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                ))}
                {(!documents || documents.length === 0) && <p className="text-slate-500 col-span-full">No documents uploaded.</p>}
                </div>
            )}
            <DocumentUpload isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} providerId={provider.id} />
          </TabsContent>

          <TabsContent value="communications" className="mt-0">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Communication History</h3>
              <Button onClick={() => setIsCommModalOpen(true)} size="sm" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Log Communication</Button>
            </div>
            {commsLoading ? (
                <div className="text-slate-400 text-center py-4">Loading communications...</div>
            ) : (
                <div className="space-y-6 relative border-l border-slate-700 ml-4 pl-8">
                {communications && communications.map(comm => (
                    <div key={comm.id} className="relative">
                    <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-slate-800 border-2 border-[hsl(var(--terracotta))]"></span>
                    <div className="bg-slate-800 p-4 rounded border border-slate-700">
                        <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-[hsl(var(--terracotta))] uppercase tracking-wider">{comm.channel}</span>
                        <span className="text-xs text-slate-500">{new Date(comm.created_at).toLocaleString()}</span>
                        </div>
                        <h4 className="text-white font-medium mb-1">{comm.subject}</h4>
                        <p className="text-slate-400 text-sm mb-3">{comm.summary}</p>
                        {comm.next_action && (
                        <div className="text-xs bg-slate-900/50 p-2 rounded text-slate-300">
                            <span className="text-yellow-500 font-bold">Next:</span> {comm.next_action}
                            {comm.follow_up_date && <span className="ml-2 opacity-70">(Due: {comm.follow_up_date})</span>}
                        </div>
                        )}
                    </div>
                    </div>
                ))}
                {(!communications || communications.length === 0) && <p className="text-slate-500">No communications logged.</p>}
                </div>
            )}
            <CommunicationForm isOpen={isCommModalOpen} onClose={() => setIsCommModalOpen(false)} providerId={provider.id} />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this provider? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProvider}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfile;