import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AMAZON_CATEGORIES } from '@/constants/amazonCategories';

const SearchFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  mainCategoryFilter, 
  setMainCategoryFilter,
  subCategoryFilter,
  setSubCategoryFilter
}) => {
  const handleClear = () => {
    setSearchTerm('');
    setMainCategoryFilter('');
    setSubCategoryFilter('');
  };

  const handleMainCategoryChange = (e) => {
    setMainCategoryFilter(e.target.value);
    setSubCategoryFilter(''); // Reset subcategory when main category changes
  };

  const hasActiveFilters = searchTerm || mainCategoryFilter || subCategoryFilter;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex flex-col gap-4">
        {/* Top Row: Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
          />
        </div>

        {/* Bottom Row: Category Filters & Clear Button */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
             <select
              value={mainCategoryFilter}
              onChange={handleMainCategoryChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
            >
              <option value="">All Categories</option>
              {Object.keys(AMAZON_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-1/3">
             <select
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              disabled={!mainCategoryFilter}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))] disabled:opacity-50"
            >
              <option value="">All Subcategories</option>
              {mainCategoryFilter && AMAZON_CATEGORIES[mainCategoryFilter]?.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="w-full md:w-auto flex-shrink-0">
               <Button
                variant="outline"
                onClick={handleClear}
                className="w-full md:w-auto border-slate-600 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
        
        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
            <span className="flex items-center"><Filter className="w-3 h-3 mr-1" /> Active Filters:</span>
            {searchTerm && <span className="bg-slate-700 px-2 py-1 rounded">Search: "{searchTerm}"</span>}
            {mainCategoryFilter && <span className="bg-slate-700 px-2 py-1 rounded">Category: {mainCategoryFilter}</span>}
            {subCategoryFilter && <span className="bg-slate-700 px-2 py-1 rounded">Sub: {subCategoryFilter}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;