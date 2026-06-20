import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useListingByProductMarketplace = (productMarketplaceId) => {
  const [brief, setBrief] = useState(null);
  const [assets, setAssets] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchListingData = useCallback(async () => {
    if (!productMarketplaceId) return;
    setLoading(true);
    try {
      // Parallel fetch
      const [briefRes, assetsRes, checklistRes] = await Promise.all([
        supabase.from('listing_briefs').select('*').eq('product_marketplace_id', productMarketplaceId).maybeSingle(),
        supabase.from('creative_assets').select('*').eq('product_marketplace_id', productMarketplaceId).order('display_order'),
        supabase.from('listing_checklist').select('*').eq('product_marketplace_id', productMarketplaceId).order('id')
      ]);

      if (briefRes.error) console.error('Error fetching brief:', briefRes.error);
      if (assetsRes.error) console.error('Error fetching assets:', assetsRes.error);
      if (checklistRes.error) console.error('Error fetching checklist:', checklistRes.error);

      setBrief(briefRes.data || null);
      setAssets(assetsRes.data || []);
      setChecklist(checklistRes.data || []);
    } catch (err) {
      console.error('Error fetching listing data:', err);
    } finally {
      setLoading(false);
    }
  }, [productMarketplaceId]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  return { brief, assets, checklist, loading, refetch: fetchListingData };
};