import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Eye, Edit, Trash2, Copy, Lock } from 'lucide-react';
import { useFilteredProducts } from '@/hooks/useFilteredData';
import { useProducts } from '@/hooks/useProducts';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import ComplianceStatusColumn from './ComplianceStatusColumn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ProductComplianceCell = ({ productId }) => {
   return <ComplianceStatusColumn productId={productId} />;
};

export default function ProductTable({ selectedMarketplaceId = 'all' }) {
  const { products = [], loading, error, fetchProducts } = useFilteredProducts(selectedMarketplaceId);
  const { deleteProduct, duplicateProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm } = useConfirm();
  const { canEditRecord, canDeleteRecord } = useAuthorization();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchProducts, searchTerm, selectedMarketplaceId]);

  const handleDelete = async (id) => {
    if (await confirm({ 
      title: 'Delete Product', 
      description: 'Are you sure you want to delete this product? This action cannot be undone.',
      variant: 'destructive'
    })) {
      await deleteProduct(id);
      fetchProducts(searchTerm); 
    }
  };
  
  const handleDuplicate = async (id) => {
    await duplicateProduct(id);
    fetchProducts(searchTerm);
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">Error loading products (Access Denied or Network Error).</p>
        <Button onClick={() => fetchProducts(searchTerm)}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            className="pl-8 bg-slate-900 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-slate-400 text-sm">
          Total: {products.length}
        </div>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300">Product Name</TableHead>
              <TableHead className="text-slate-300">Brand</TableHead>
              <TableHead className="text-slate-300">Category</TableHead>
              <TableHead className="text-slate-300">Mkts</TableHead>
              <TableHead className="text-slate-300">Compliance</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const canEdit = canEditRecord(product);
                const canDelete = canDeleteRecord(product);

                return (
                  <TableRow key={product.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-100">
                      <Link to={`/products/${product.id}`} className="hover:text-[hsl(var(--terracotta))] hover:underline">
                        {product.product_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-400">{product.brand || '-'}</TableCell>
                    <TableCell className="text-slate-400">{product.main_category || '-'}</TableCell>
                    <TableCell className="text-slate-400">
                      <Badge variant="outline" className="border-slate-600">
                        {product.product_marketplaces?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <ProductComplianceCell productId={product.id} />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.status === 'Active' ? 'default' : 'secondary'}
                        className={product.status === 'Active' ? 'bg-[hsl(var(--terracotta))]/20 text-[hsl(var(--terracotta))]' : ''}
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/products/${product.id}`} className="flex items-center cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          
                          {canEdit ? (
                            <DropdownMenuItem asChild>
                              <Link to={`/products/${product.id}/edit`} className="flex items-center cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                              <Lock className="mr-2 h-4 w-4" /> Edit (Restricted)
                            </DropdownMenuItem>
                          )}
                          
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleDuplicate(product.id)} className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator className="bg-slate-700" />
                          
                          {canDelete ? (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed text-slate-500">
                               <Lock className="mr-2 h-4 w-4" /> Delete (Restricted)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}