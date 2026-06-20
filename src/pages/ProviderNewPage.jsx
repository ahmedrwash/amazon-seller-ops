import React from 'react';
import Header from '@/components/Header';
import ProviderWizard from '@/components/providers/ProviderWizard';

const ProviderNewPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <div className="mb-8">
           <h2 className="text-2xl font-bold text-white mb-2">Add New Provider</h2>
           <p className="text-slate-400">Enter details to add a new service provider to your database.</p>
        </div>
        <ProviderWizard />
      </div>
    </div>
  );
};

export default ProviderNewPage;