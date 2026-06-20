import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ProviderProfile from '@/components/providers/ProviderProfile';
import { useProviderById } from '@/hooks/useServiceProviders';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const ProviderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { provider, loading } = useProviderById(id);

  if (loading) return <div className="min-h-screen bg-slate-900 p-8 text-white text-center">Loading...</div>;
  if (!provider) return <div className="min-h-screen bg-slate-900 p-8 text-white text-center">Provider not found</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        
        <div className="flex items-center gap-4 mb-4">
           <Button variant="ghost" onClick={() => navigate('/providers')} className="text-slate-400 hover:text-white pl-0">
             <ChevronLeft className="w-4 h-4 mr-1" /> Back to Providers
           </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-3xl font-bold text-white">{provider.provider_name}</h1>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                   provider.status === 'Active' ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-300'
                 }`}>{provider.status}</span>
              </div>
              <p className="text-slate-400">{provider.provider_type} • {provider.country}</p>
           </div>
           <div className="text-yellow-500 text-lg">
             {'★'.repeat(provider.internal_rating)}{'☆'.repeat(5 - provider.internal_rating)}
           </div>
        </div>

        <ProviderProfile provider={provider} />
      </div>
    </div>
  );
};

export default ProviderDetailPage;