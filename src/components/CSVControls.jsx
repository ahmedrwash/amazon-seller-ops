import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { exportToCSV } from '@/utils/csvExport';
import { importFromCSV } from '@/utils/csvImport';

const CSVControls = ({ products, onImport }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      if (products.length === 0) {
        toast({
          title: 'No Products',
          description: 'Add some products before exporting',
          variant: 'destructive'
        });
        return;
      }

      exportToCSV(products);
      toast({
        title: 'Export Successful',
        description: `${products.length} products exported to CSV`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedProducts = await importFromCSV(file);
      onImport(importedProducts);
      toast({
        title: 'Import Successful',
        description: `${importedProducts.length} products imported from CSV`,
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      });
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleExport}
        className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      
      <Button
        onClick={handleImportClick}
        variant="outline"
        className="border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import CSV
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default CSVControls;