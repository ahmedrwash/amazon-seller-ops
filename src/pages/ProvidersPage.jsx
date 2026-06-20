import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderTable from '@/components/providers/ProviderTable';
import { useProviders } from '@/hooks/useServiceProviders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Search, AlertCircle } from 'lucide-react';
import { exportProvidersToCSV } from '@/utils/providerExport';
import { ProviderStatus } from '@/types/serviceProviders';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Helmet } from 'react-helmet';

const ProvidersPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { providers, loading, error } = useProviders({ search: debouncedSearch, status: statusFilter });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Providers - Amazon Seller Operation</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-white">Service Providers</h2>
            <p className="text-slate-400">Manage your network of manufacturers, freight forwarders, and agencies.</p>
         </div>
         <div className="flex gap-2">
           <Button onClick={() => navigate('/providers/new')} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
             <Plus className="w-4 h-4 mr-2" /> Add Provider
           </Button>
           <Button variant="outline" onClick={() => exportProvidersToCSV(providers)} className="border-slate-600 text-white hover:bg-slate-800" disabled={loading || providers.length === 0}>
             <Download className="w-4 h-4 mr-2" /> Export
           </Button>
         </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-wrap gap-4 items-center">
         <div className="relative flex-1 min-w-[250px]">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
           <Input 
              placeholder="Search providers..." 
              className="pl-9 bg-slate-900 border-slate-600 text-white" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
         </div>
         <select 
           className="h-10 px-3 rounded-md bg-slate-900 border-slate-600 text-white min-w-[150px]"
           value={statusFilter}
           onChange={(e) => setStatusFilter(e.target.value)}
         >
           <option value="">All Statuses</option>
           {Object.values(ProviderStatus).map(s => <option key={s} value={s}>{s}</option>)}
         </select>
      </div>

      {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                  Failed to load providers. Please check your connection and try again.
              </AlertDescription>
          </Alert>
      )}

      <ProviderTable providers={providers} loading={loading} />
    </div>
  );
};

export default ProvidersPage;