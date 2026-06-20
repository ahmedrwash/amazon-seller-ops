import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function useOpsHubData() {
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, sku, asin, main_category, notes')
        .order('created_at', { ascending: false });
      
      if (!error) setProducts(data || []);
      else console.error("Error fetching products:", error);
      setIsLoading(false);
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    return { products, isLoading, refetch: fetchProducts };
  };

  const loadMasterData = async (productId) => {
    if (!productId) return null;
    const { data, error } = await supabase
      .from('product_master_inputs')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') console.error("Error loading master data:", error);
    return data || { data: {} };
  };

  const loadWeeklyData = async (productId, week) => {
    if (!productId || !week) return null;
    
    const { data, error } = await supabase
      .from('product_weekly_data')
      .select('*')
      .eq('product_id', productId)
      .eq('week_number', week)
      .maybeSingle();
      
    if (error) console.error("Error loading weekly data:", error);
    
    return data || { product_id: productId, week_number: week };
  };

  const saveMasterData = async (productId, updates) => {
    const userId = await getUserId();
    if (!userId || !productId) return;
    
    const { error } = await supabase
      .from('product_master_inputs')
      .upsert({ 
        product_id: productId, 
        user_id: userId, 
        data: updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id' });

    if (error) throw error;
  };

  const saveWeeklyData = async (productId, week, updates) => {
    const userId = await getUserId();
    if (!userId || !productId || !week) return;
    
    const { data, error } = await supabase
      .from('product_weekly_data')
      .upsert({ 
        product_id: productId, 
        user_id: userId, 
        week_number: week, 
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id, week_number' })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const importPreviousWeekData = async (productId, currentWeek) => {
    if (currentWeek <= 1) throw new Error("No previous week available.");
    
    const { data: prevData, error } = await supabase
      .from('product_weekly_data')
      .select('*')
      .eq('product_id', productId)
      .eq('week_number', currentWeek - 1)
      .maybeSingle();
      
    if (error || !prevData) throw new Error("No data found for the previous week.");
    
    const { id, product_id, week_number, user_id, created_at, updated_at, data, ...rest } = prevData;
    
    return saveWeeklyData(productId, currentWeek, rest);
  };

  const createProduct = async (productData) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        product_name: productData.product_name,
        sku: productData.sku,
        asin: productData.asin,
        main_category: productData.category,
        created_by: userId,
        owner_id: userId
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const updateProduct = async (productId, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const deleteProduct = async (productId) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  };

  return {
    useProducts,
    loadMasterData,
    loadWeeklyData,
    saveMasterData,
    saveWeeklyData,
    importPreviousWeekData,
    createProduct,
    updateProduct,
    deleteProduct
  };
}