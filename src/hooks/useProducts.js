import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useAuditLog } from '@/hooks/useAuditLog';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { session } = useAuth();
  const { allowedMarketplaceIds, isAdmin } = useAuthorization();
  const { logAction } = useAuditLog();

  const getProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          product_marketplaces (
            id,
            marketplace_id,
            stage,
            priority
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('product_name', `%${filters.search}%`);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, [toast, isAdmin, allowedMarketplaceIds]);

  const getProductById = useCallback(async (id) => {
    try {
      setLoading(true);
      // Using maybeSingle() to prevent PGRST116 error when no rows are returned
      const { data, error: err } = await supabase
        .from('products')
        .select(`
          *,
          product_marketplaces (
            *,
            marketplaces (
              code,
              name
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (err) throw err;
      return data;
    } catch (err) {
      console.error('Error fetching product:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch product details',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProduct = async (productData, marketplacesData = []) => {
    try {
      setLoading(true);
      
      const { data: product, error: prodError } = await supabase
        .from('products')
        .insert([{
          ...productData,
          created_by: session.user.id,
          owner_id: session.user.id // Default owner
        }])
        .select()
        .maybeSingle();

      if (prodError) throw prodError;
      if (!product) throw new Error('Failed to create product');

      // Audit Log
      await logAction({
        action: 'CREATE',
        tableName: 'products',
        recordId: product.id,
        newValues: product,
        reason: 'Initial creation'
      });

      if (marketplacesData.length > 0) {
        const mps = marketplacesData.map(mp => ({
          ...mp,
          product_id: product.id
        }));
        
        const { error: mpError } = await supabase
          .from('product_marketplaces')
          .insert(mps);

        if (mpError) throw mpError;
      }

      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      return product;
    } catch (err) {
      console.error('Error creating product:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, data) => {
    try {
      setLoading(true);
      
      // Get old data for audit
      const { data: oldData } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

      const { data: updated, error: err } = await supabase
        .from('products')
        .update({ ...data, updated_at: new Date(), updated_by: session.user.id })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (err) throw err;
      if (!updated) throw new Error('Product not found or update failed');

      await logAction({
        action: 'UPDATE',
        tableName: 'products',
        recordId: id,
        oldValues: oldData,
        newValues: updated
      });
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      setLoading(true);
      const { data: oldData } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

      // 1. Handle cascade delete for product_import_jobs
      // First get the jobs to delete their dependencies
      const { data: jobs } = await supabase
        .from('product_import_jobs')
        .select('id')
        .eq('product_id', id);

      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map(j => j.id);

        // Delete assets associated with these jobs
        const { error: assetsError } = await supabase
          .from('product_import_assets')
          .delete()
          .in('job_id', jobIds);
        
        if (assetsError) throw new Error(`Failed to delete import assets: ${assetsError.message}`);

        // Delete audit logs associated with these jobs
        const { error: auditError } = await supabase
          .from('product_import_audit_log')
          .delete()
          .in('job_id', jobIds);

        if (auditError) throw new Error(`Failed to delete import audit logs: ${auditError.message}`);

        // Now delete the jobs
        const { error: jobsError } = await supabase
          .from('product_import_jobs')
          .delete()
          .eq('product_id', id);

        if (jobsError) throw new Error(`Failed to delete import jobs: ${jobsError.message}`);
      }

      // 2. Delete the product
      const { error: err } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (err) {
        // Check for foreign key violation (Postgres code 23503)
        if (err.code === '23503') {
          throw new Error('Cannot delete product because it is referenced by other records (e.g., Marketplaces, Documents). Please delete those dependencies first.');
        }
        throw err;
      }
      
      await logAction({
        action: 'DELETE',
        tableName: 'products',
        recordId: id,
        oldValues: oldData
      });

      toast({
        title: 'Success',
        description: 'Product and related data deleted successfully',
      });
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({
        title: 'Deletion Failed',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const duplicateProduct = async (id) => {
    try {
      setLoading(true);
      const original = await getProductById(id);
      if (!original) return;

      const { id: _, created_at, updated_at, product_marketplaces, ...rest } = original;
      
      const newProductData = {
        ...rest,
        product_name: `${rest.product_name} (Copy)`,
        created_by: session.user.id
      };

      await createProduct(newProductData);
      getProducts(); 
    } catch (err) {
       console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct
  };
};