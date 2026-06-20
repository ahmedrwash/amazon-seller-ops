import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';

const MarketplaceContext = createContext(undefined);

export const MarketplaceProvider = ({ children }) => {
  const [storedValue, setStoredValue] = useLocalStorage("global_marketplace_id", "all");
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState(storedValue);
  
  const { allowedMarketplaceIds, isAdmin, hasMarketplaceAccess } = useAuthorization();
  const { toast } = useToast();

  // Validate selection against permissions
  useEffect(() => {
    if (selectedMarketplaceId === 'all') {
      if (!isAdmin) {
        // If not admin, they can't select 'all', must select specific
        if (allowedMarketplaceIds.length > 0) {
           setSelectedMarketplaceId(allowedMarketplaceIds[0]);
           setStoredValue(allowedMarketplaceIds[0]);
        } else {
           // No access to any marketplace
           setSelectedMarketplaceId(null);
        }
      }
    } else if (selectedMarketplaceId) {
      // Check if specific selection is allowed
      if (!hasMarketplaceAccess(selectedMarketplaceId)) {
        toast({
          title: "Access Restricted",
          description: "You do not have access to this marketplace. Switching to first allowed.",
          variant: "destructive"
        });
        
        if (allowedMarketplaceIds.length > 0) {
           setSelectedMarketplaceId(allowedMarketplaceIds[0]);
        } else {
           setSelectedMarketplaceId(null);
        }
      }
    }
  }, [selectedMarketplaceId, allowedMarketplaceIds, isAdmin, hasMarketplaceAccess, setStoredValue, toast]);

  // Sync state with localStorage when it changes
  useEffect(() => {
    if (selectedMarketplaceId) {
       setStoredValue(selectedMarketplaceId);
    }
  }, [selectedMarketplaceId, setStoredValue]);

  const isAll = selectedMarketplaceId === "all";

  const clearMarketplace = () => {
    if (isAdmin) {
      setSelectedMarketplaceId("all");
    } else if (allowedMarketplaceIds.length > 0) {
      setSelectedMarketplaceId(allowedMarketplaceIds[0]);
    }
  };
  
  const getAllowedMarketplaces = () => {
    return allowedMarketplaceIds;
  };

  const value = {
    selectedMarketplaceId,
    setSelectedMarketplaceId,
    isAll,
    clearMarketplace,
    getAllowedMarketplaces,
    isMarketplaceAllowed: hasMarketplaceAccess
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplaceContext = () => {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplaceContext must be used within a MarketplaceProvider');
  }
  return context;
};