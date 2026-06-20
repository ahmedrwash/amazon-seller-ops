import { useState, useEffect } from 'react';
import { useComplianceItems } from './useComplianceItems';
import { useReadinessChecklist } from './useReadinessChecklist';

export const useComplianceByProductMarketplace = (productMarketplaceId) => {
  const { 
    items: complianceItems, 
    fetchComplianceItems, 
    loading: complianceLoading, 
    createComplianceItem,
    updateComplianceItem,
    deleteComplianceItem
  } = useComplianceItems();
  
  const { 
    items: readinessItems, 
    fetchReadinessItems, 
    loading: readinessLoading,
    createReadinessItem,
    updateReadinessItem,
    deleteReadinessItem
  } = useReadinessChecklist();

  useEffect(() => {
    if (productMarketplaceId) {
      fetchComplianceItems({ product_marketplace_id: productMarketplaceId });
      fetchReadinessItems({ product_marketplace_id: productMarketplaceId });
    }
  }, [productMarketplaceId, fetchComplianceItems, fetchReadinessItems]);

  return {
    complianceItems,
    readinessItems,
    loading: complianceLoading || readinessLoading,
    createComplianceItem,
    updateComplianceItem,
    deleteComplianceItem,
    createReadinessItem,
    updateReadinessItem,
    deleteReadinessItem,
    refetch: () => {
      if (productMarketplaceId) {
         fetchComplianceItems({ product_marketplace_id: productMarketplaceId });
         fetchReadinessItems({ product_marketplace_id: productMarketplaceId });
      }
    }
  };
};