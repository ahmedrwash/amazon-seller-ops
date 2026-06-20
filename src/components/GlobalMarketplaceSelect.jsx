import React, { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Lock } from 'lucide-react';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { useMarketplaceContext } from '@/contexts/MarketplaceContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

const GlobalMarketplaceSelect = () => {
  const { marketplaces, loading, error, fetchMarketplaces } = useMarketplaces();
  const { selectedMarketplaceId, setSelectedMarketplaceId } = useMarketplaceContext();
  const { session } = useAuth();
  const { isAdmin, allowedMarketplaceIds } = useAuthorization();

  useEffect(() => {
    if (session) {
      fetchMarketplaces({ active: true });
    }
  }, [session, fetchMarketplaces]);

  if (!session) return null;

  if (error) {
    return <div className="text-red-500 text-xs hidden md:block">Error loading marketplaces</div>;
  }

  // Filter marketplaces based on permissions
  const visibleMarketplaces = marketplaces.filter(mp => 
    isAdmin || allowedMarketplaceIds.includes(mp.id)
  );
  
  const isRestricted = !isAdmin && allowedMarketplaceIds.length < marketplaces.length;

  return (
    <div className="flex items-center gap-2">
      {isRestricted && (
        <Badge variant="outline" className="hidden md:flex bg-amber-900/20 text-amber-500 border-amber-800 text-[10px] h-5 px-1.5 gap-1">
          <Lock className="w-2.5 h-2.5" /> Restricted
        </Badge>
      )}
      <Select 
        value={selectedMarketplaceId || ''} 
        onValueChange={setSelectedMarketplaceId}
        disabled={loading || visibleMarketplaces.length === 0}
      >
        <SelectTrigger className="w-[180px] h-9 bg-slate-800 border-slate-700 text-slate-200 focus:ring-[hsl(var(--terracotta))]/50">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-[hsl(var(--terracotta))] flex-shrink-0" />
            <SelectValue placeholder={loading ? "Loading..." : "Select Marketplace"} />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 max-h-[300px]">
          {isAdmin && (
            <SelectItem value="all" className="focus:bg-slate-800 focus:text-[hsl(var(--terracotta))] cursor-pointer font-semibold border-b border-slate-800 mb-1 pb-1">
              All Marketplaces
            </SelectItem>
          )}
          {visibleMarketplaces.map((mp) => (
            <SelectItem 
              key={mp.id} 
              value={mp.id}
              className="focus:bg-slate-800 focus:text-[hsl(var(--terracotta))] cursor-pointer"
            >
              {mp.code} - {mp.name}
            </SelectItem>
          ))}
          {visibleMarketplaces.length === 0 && !loading && (
             <div className="p-2 text-xs text-slate-500 text-center">No allowed marketplaces</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GlobalMarketplaceSelect;