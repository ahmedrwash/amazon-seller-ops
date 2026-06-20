import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2 } from 'lucide-react';
import { formatCurrency, isQuoteExpired } from '@/utils/supplierUtils';
import { format } from 'date-fns';
import { useSupplierQuotes } from '@/hooks/useSupplierQuotes';
import QuoteModal from './QuoteModal';
import QuoteComparisonModal from './QuoteComparisonModal';
import { cn } from '@/lib/utils';

const SupplierQuotesTab = ({ supplierId }) => {
  const { quotes, loading, fetchQuotes, createQuote, updateQuote, deleteQuote } = useSupplierQuotes();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCompareOpen, setCompareOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);

  React.useEffect(() => {
    if (supplierId) fetchQuotes(supplierId);
  }, [supplierId, fetchQuotes]);

  const handleSave = async (data) => {
    if (editingQuote) {
      await updateQuote(editingQuote.id, data);
    } else {
      await createQuote(data);
    }
    setModalOpen(false);
    setEditingQuote(null);
  };

  const handleCompare = (quote) => {
     setSelectedProduct({ id: quote.product_id, name: quote.products?.product_name });
     setCompareOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-medium text-slate-200">Price Quotes</h3>
         <Button onClick={() => { setEditingQuote(null); setModalOpen(true); }} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            <Plus className="w-4 h-4 mr-2" /> Add Quote
         </Button>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
               <TableHead className="text-slate-300">Product</TableHead>
               <TableHead className="text-slate-300">Unit Cost</TableHead>
               <TableHead className="text-slate-300">MOQ</TableHead>
               <TableHead className="text-slate-300">Lead Time</TableHead>
               <TableHead className="text-slate-300">Incoterms</TableHead>
               <TableHead className="text-slate-300">Valid Until</TableHead>
               <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {quotes.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-slate-500">No quotes added yet.</TableCell>
                </TableRow>
             ) : (
                quotes.map(quote => {
                   const expired = isQuoteExpired(quote.valid_until);
                   return (
                      <TableRow key={quote.id} className={cn("border-slate-700 hover:bg-slate-800/50", expired && "opacity-60")}>
                         <TableCell className="font-medium text-slate-200">{quote.products?.product_name}</TableCell>
                         <TableCell>{formatCurrency(quote.unit_cost, quote.currency)}</TableCell>
                         <TableCell>{quote.moq}</TableCell>
                         <TableCell>{quote.lead_time_days} days</TableCell>
                         <TableCell>{quote.incoterms}</TableCell>
                         <TableCell className={cn(expired && "text-red-400 font-medium")}>
                            {quote.valid_until ? format(new Date(quote.valid_until), 'MMM d, yyyy') : '-'}
                            {expired && <span className="ml-2 text-xs">(Expired)</span>}
                         </TableCell>
                         <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="sm" onClick={() => handleCompare(quote)} title="Compare">
                                  <BarChart2 className="w-4 h-4 text-blue-400" />
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => { setEditingQuote(quote); setModalOpen(true); }}>Edit</Button>
                            </div>
                         </TableCell>
                      </TableRow>
                   );
                })
             )}
          </TableBody>
        </Table>
      </div>

      <QuoteModal 
         isOpen={isModalOpen}
         onClose={() => setModalOpen(false)}
         onSave={handleSave}
         initialQuote={editingQuote}
         loading={loading}
         defaultSupplierId={supplierId}
      />

      <QuoteComparisonModal
         isOpen={isCompareOpen}
         onClose={() => setCompareOpen(false)}
         productId={selectedProduct?.id}
         productName={selectedProduct?.name}
      />
    </div>
  );
};

export default SupplierQuotesTab;