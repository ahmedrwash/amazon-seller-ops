import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProductTable from '@/components/products/ProductTable';
import { useRole } from '@/hooks/useRole';
import { useMarketplaceContext } from '@/contexts/MarketplaceContext';

const ProductsPage = () => {
  const { isViewer, isFinance } = useRole();
  const canEdit = !isViewer && !isFinance;
  const { selectedMarketplaceId, isAll } = useMarketplaceContext();
  const [filterByMarketplace, setFilterByMarketplace] = useState(true);

  // If "All" selected, toggle is irrelevant/disabled effectively
  const effectiveMarketplaceId = (!isAll && filterByMarketplace) ? selectedMarketplaceId : 'all';

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Products - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Product Portfolio</h2>
          <p className="text-slate-400">Manage your product catalog and lifecycle</p>
        </div>
        
        <div className="flex items-center gap-4">
           {!isAll && (
             <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2 rounded-md border border-slate-800">
               <Switch 
                  id="mkt-filter" 
                  checked={filterByMarketplace}
                  onCheckedChange={setFilterByMarketplace}
               />
               <Label htmlFor="mkt-filter" className="text-sm text-slate-300 cursor-pointer">
                 Filter by Selected Marketplace
               </Label>
             </div>
           )}
           
           {canEdit && (
             <Link to="/products/new">
               <Button className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
                 <Plus className="mr-2 h-4 w-4" /> Add Product
               </Button>
             </Link>
           )}
        </div>
      </div>

      <ProductTable selectedMarketplaceId={effectiveMarketplaceId} />
    </div>
  );
};

export default ProductsPage;