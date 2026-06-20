import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, ArrowLeft, Trash2, Calendar, User, ShieldAlert } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useProductMarketplaces } from '@/hooks/useProductMarketplaces';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmbeddedTasksTab from '@/components/tasks/EmbeddedTasksTab';
import ListingTab from '@/components/listing/ListingTab';
import EmbeddedInventoryTab from '@/components/inventory/EmbeddedInventoryTab';
import ProfitabilityTab from '@/components/finance/ProfitabilityTab';
import GrowthTab from '@/components/growth/GrowthTab';
import AuditTrail from '@/components/AuditTrail';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuthorization } from '@/hooks/useAuthorization';

export default function ProductDetail({ product: initialProduct }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, deleteProduct } = useProducts();
  const { marketplaces: productMarketplaces, getProductMarketplaces } = useProductMarketplaces();
  const { confirm } = useConfirm();
  const { canEditRecord, canDeleteRecord } = useAuthorization();
  
  const [product, setProduct] = React.useState(initialProduct);

  React.useEffect(() => {
     if (!initialProduct && id) {
        const fetch = async () => {
           const p = await getProduct(id);
           setProduct(p);
        };
        fetch();
     }
  }, [id, initialProduct, getProduct]);
  
  React.useEffect(() => {
      if (id) getProductMarketplaces(id);
  }, [id, getProductMarketplaces]);

  const handleDelete = async () => {
    if (await confirm({
      title: 'Delete Product',
      description: 'Are you sure you want to delete this product? This will also permanently delete any associated import jobs. This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete Product'
    })) {
      const success = await deleteProduct(product.id);
      if (success) navigate('/products');
    }
  };

  if (!product) return <div className="p-8 text-center text-slate-400">Loading details...</div>;

  const canEdit = canEditRecord(product);
  const canDelete = canDeleteRecord(product);
  const defaultPMID = productMarketplaces?.[0]?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Button variant="ghost" size="sm" onClick={() => navigate('/products')} className="p-0 h-auto text-slate-400 hover:text-white">
               <ArrowLeft className="h-4 w-4 mr-1" /> Back
             </Button>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {product.product_name}
            <Badge className={product.status === 'Active' ? 'bg-[hsl(var(--terracotta))]' : 'bg-slate-600'}>
              {product.status}
            </Badge>
          </h1>
          <p className="text-slate-400 mt-1">
            {product.brand} • {product.main_category}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <Button variant="outline" onClick={() => navigate(`/products/${product.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" /> Edit Product
            </Button>
          ) : (
            <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
              <ShieldAlert className="h-4 w-4 mr-2" /> Read Only
            </Button>
          )}
          
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="listing">Listing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-500">Product Name</label>
                <p className="text-slate-200 font-medium">{product.product_name}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Brand</label>
                <p className="text-slate-200 font-medium">{product.brand || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-500">Notes</label>
                <p className="text-slate-200 whitespace-pre-wrap">{product.notes || '-'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
             <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
             <div className="flex gap-6 text-sm text-slate-400">
               <div className="flex items-center gap-2">
                 <Calendar className="h-4 w-4" /> Created: {new Date(product.created_at).toLocaleDateString()}
               </div>
               <div className="flex items-center gap-2">
                 <User className="h-4 w-4" /> Owner ID: {product.owner_id || product.created_by || 'Unknown'}
               </div>
             </div>
          </div>
        </TabsContent>
        
        {/* Pass props to tabs */}
        <TabsContent value="profitability" className="mt-6">
            {defaultPMID ? <ProfitabilityTab productId={product.id} productMarketplaceId={defaultPMID} /> : <div className="p-4 text-center">No marketplace</div>}
        </TabsContent>
        
        <TabsContent value="growth" className="mt-6">
            {defaultPMID ? <GrowthTab productId={product.id} productMarketplaceId={defaultPMID} /> : <div className="p-4 text-center">No marketplace</div>}
        </TabsContent>

        <TabsContent value="listing" className="mt-6">
            {defaultPMID ? <ListingTab productMarketplaceId={defaultPMID} /> : <div className="p-4 text-center">No marketplace</div>}
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
           <EmbeddedInventoryTab entityType="Product" entityId={product.id} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
           <EmbeddedTasksTab entityType="Product" entityId={product.id} />
        </TabsContent>

        <TabsContent value="marketplaces" className="mt-6">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Marketplaces</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Stage</TableHead></TableRow></TableHeader>
              <TableBody>
                {productMarketplaces?.map(pm => (
                  <TableRow key={pm.id}>
                    <TableCell className="font-medium text-[hsl(var(--terracotta))]">{pm.marketplaces?.code}</TableCell>
                    <TableCell>{pm.stage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
           <AuditTrail tableName="products" recordId={product.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}