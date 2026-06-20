import React, { useState } from 'react';
import { useOpsHubData } from '@/hooks/useOpsHubData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function ProductMasterDataPage() {
  const { useProducts, createProduct, deleteProduct } = useOpsHubData();
  const { products, isLoading, refetch } = useProducts();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_name: '', sku: '', asin: '', category: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!newProduct.product_name) return toast({ title: "Name required", variant: "destructive" });
    setIsSubmitting(true);
    try {
      await createProduct(newProduct);
      toast({ title: "Product Created" });
      setIsCreateOpen(false);
      setNewProduct({ product_name: '', sku: '', asin: '', category: '' });
      refetch();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product? All related master data and weekly data will be deleted.")) return;
    try {
      await deleteProduct(id);
      toast({ title: "Product Deleted" });
      refetch();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading text-[hsl(var(--cinder))]">Product Master Data</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta-light))] text-white">
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Product</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Product Name</Label><Input value={newProduct.product_name} onChange={e => setNewProduct({...newProduct, product_name: e.target.value})} /></div>
              <div><Label>SKU</Label><Input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} /></div>
              <div><Label>ASIN</Label><Input value={newProduct.asin} onChange={e => setNewProduct({...newProduct, asin: e.target.value})} /></div>
              <div><Label>Category</Label><Input value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} /></div>
              <Button onClick={handleCreate} disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))] overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-[hsl(var(--stone-light))] text-[hsl(var(--cinder))]">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">ASIN</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No products found.</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b border-[hsl(var(--border))]">
                    <td className="px-4 py-3 font-medium">{p.product_name}</td>
                    <td className="px-4 py-3 font-mono-num">{p.sku}</td>
                    <td className="px-4 py-3 font-mono-num">{p.asin}</td>
                    <td className="px-4 py-3">{p.main_category}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-[hsl(var(--red))] hover:text-[hsl(var(--red))] hover:bg-[hsl(var(--red-light))]">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}