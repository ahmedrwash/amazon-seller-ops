import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketplaces } from '@/hooks/useMarketplaces';

const MarketplaceSelect = ({ value, onChange, disabled, placeholder = "Select Marketplace" }) => {
  const { marketplaces, loading } = useMarketplaces();
  
  // Filter for active marketplaces only for selection
  const activeMarketplaces = marketplaces.filter(m => m.active);

  return (
    <Select 
      value={value} 
      onValueChange={onChange} 
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {activeMarketplaces.map((m) => (
          <SelectItem key={m.id} value={m.code}>
            {m.code} - {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MarketplaceSelect;