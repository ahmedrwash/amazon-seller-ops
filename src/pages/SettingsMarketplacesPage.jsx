import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import MarketplaceTable from '@/components/marketplaces/MarketplaceTable';
import MarketplaceModal from '@/components/marketplaces/MarketplaceModal';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useConfirm } from '@/context/ConfirmContext';

export default function SettingsMarketplacesPage() {
  const { 
    marketplaces, 
    loading, 
    fetchMarketplaces, 
    createMarketplace, 
    updateMarketplace, 
    deleteMarketplace, 
    toggleActive 
  } = useMarketplaces();
  
  const { isAdmin } = useAdminCheck();
  const { confirm } = useConfirm();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarketplace, setEditingMarketplace] = useState(null);
  
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarketplaces({ 
        search, 
        region: regionFilter, 
        active: statusFilter 
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, regionFilter, statusFilter, fetchMarketplaces]);

  const handleAdd = () => {
    setEditingMarketplace(null);
    setIsModalOpen(true);
  };

  const handleEdit = (marketplace) => {
    setEditingMarketplace(marketplace);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (await confirm({ 
      title: 'Delete Marketplace', 
      description: 'Are you sure you want to delete this marketplace? This action cannot be undone.',
      variant: 'destructive'
    })) {
      await deleteMarketplace(id);
    }
  };

  const handleSave = async (data) => {
    if (editingMarketplace) {
      await updateMarketplace(editingMarketplace.id, data);
    } else {
      await createMarketplace(data);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Marketplace Settings - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Marketplaces</h2>
          <p className="text-slate-400">Manage supported Amazon marketplaces and regions</p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={handleAdd} 
            className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Marketplace
          </Button>
        )}
      </div>

      {!isAdmin && (
         <div className="bg-amber-900/20 border border-amber-600/50 text-amber-200 p-4 rounded-md">
           Note: You have read-only access. Only administrators can manage marketplaces.
         </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by code or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North America">North America</SelectItem>
              <SelectItem value="Europe">Europe</SelectItem>
              <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
           <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <MarketplaceTable 
        marketplaces={marketplaces}
        loading={loading}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={toggleActive}
      />

      <div className="text-sm text-slate-500">
        Total Marketplaces: {marketplaces.length}
      </div>

      <MarketplaceModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSave}
        initialData={editingMarketplace}
      />
    </div>
  );
}