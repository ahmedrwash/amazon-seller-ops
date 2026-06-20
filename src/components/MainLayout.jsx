import React from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import GlobalSettingsPanel from '@/components/GlobalSettingsPanel';
import SummaryStats from '@/components/SummaryStats';
import SearchFilter from '@/components/SearchFilter';
import ProductTable from '@/components/ProductTable';
import CSVControls from '@/components/CSVControls';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const MainLayout = ({
  products,
  filteredProducts,
  searchTerm,
  setSearchTerm,
  mainCategoryFilter,
  setMainCategoryFilter,
  subCategoryFilter,
  setSubCategoryFilter,
  onAddProduct,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkDelete,
  onImport
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        
        <GlobalSettingsPanel />
        
        {/* Pass processed products to show stats relevant to current filter view */}
        <SummaryStats products={products} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex-1 w-full">
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              mainCategoryFilter={mainCategoryFilter}
              setMainCategoryFilter={setMainCategoryFilter}
              subCategoryFilter={subCategoryFilter}
              setSubCategoryFilter={setSubCategoryFilter}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <Button
            onClick={onAddProduct}
            className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>

          {/* Note: CSV export likely needs all products, or pass filtered if user wants to export view */}
          <CSVControls products={filteredProducts} onImport={onImport} />
        </motion.div>

        <ProductTable
          products={filteredProducts}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onBulkDelete={onBulkDelete}
        />
      </div>
    </div>
  );
};

export default MainLayout;