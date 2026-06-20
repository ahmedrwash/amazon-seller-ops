import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSupplierQuotes } from '@/hooks/useSupplierQuotes';
import { calculateTotalCost, formatCurrency, getBestPrice } from '@/utils/supplierUtils';
import { CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const QuoteComparisonModal = ({ isOpen, onClose, productId, productName }) => {
  const { fetchQuotesByProduct } = useSupplierQuotes();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      const load = async () => {
        setLoading(true);
        const data = await fetchQuotesByProduct(productId);
        setQuotes(data || []);
        setLoading(false);
      };
      load();
    }
  }, [isOpen, productId, fetchQuotesByProduct]);

  const bestPriceQuote = getBestPrice(quotes);
  const shortestLeadTime = quotes.length > 0 ? Math.min(...quotes.map(q => q.lead_time_days)) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quote Comparison - <span className="text-[hsl(var(--terracotta))]">{productName}</span></DialogTitle>
        </DialogHeader>

        {loading ? (
           <div className="text-center py-8 text-slate-400">Loading quotes...</div>
        ) : quotes.length === 0 ? (
           <div className="text-center py-8 text-slate-400">No quotes available for this product.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Supplier</TableHead>
                    <TableHead className="text-slate-300">Unit Cost</TableHead>
                    <TableHead className="text-slate-300">MOQ</TableHead>
                    <TableHead className="text-slate-300">Lead Time</TableHead>
                    <TableHead className="text-slate-300">Total (100u)</TableHead>
                    <TableHead className="text-slate-300">Total (500u)</TableHead>
                    <TableHead className="text-slate-300">Total (1k)</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {quotes.map(quote => {
                    const isBestPrice = bestPriceQuote && quote.id === bestPriceQuote.id;
                    const isFastest = quote.lead_time_days === shortestLeadTime;

                    return (
                      <TableRow key={quote.id} className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell className="font-medium">
                           {quote.suppliers?.name}
                           <div className="text-xs text-slate-500">{quote.suppliers?.country}</div>
                        </TableCell>
                        <TableCell>
                           <div className={cn("flex items-center gap-1 font-bold", isBestPrice ? "text-emerald-400" : "text-slate-200")}>
                              {formatCurrency(quote.unit_cost, quote.currency)}
                              {isBestPrice && <CheckCircle2 className="w-3 h-3" />}
                           </div>
                        </TableCell>
                        <TableCell>{quote.moq}</TableCell>
                        <TableCell>
                           <div className={cn("flex items-center gap-1", isFastest ? "text-blue-400 font-medium" : "")}>
                              {quote.lead_time_days} days
                              {isFastest && <Zap className="w-3 h-3" />}
                           </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                           {formatCurrency(calculateTotalCost(quote.unit_cost, 100), quote.currency)}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                           {formatCurrency(calculateTotalCost(quote.unit_cost, 500), quote.currency)}
                        </TableCell>
                         <TableCell className="text-slate-400 text-sm">
                           {formatCurrency(calculateTotalCost(quote.unit_cost, 1000), quote.currency)}
                        </TableCell>
                      </TableRow>
                    );
                 })}
               </TableBody>
             </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuoteComparisonModal;