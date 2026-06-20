import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Copy, Trash2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Decision } from '@/types/product';

const ProductTable = ({ products, onEdit, onDuplicate, onDelete, onBulkDelete }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'totalScore', direction: 'desc' });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return (aVal - bVal) * modifier;
  });

  const getDecisionColor = (decision) => {
    switch (decision) {
      case Decision.STRONG_WINNER:
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case Decision.TEST_PRODUCT:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case Decision.REJECT:
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
        <p className="text-slate-400 text-lg">No products found. Add your first product to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-300">
            {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onBulkDelete(selectedIds);
              setSelectedIds([]);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-600 bg-slate-700"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Product
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-[hsl(var(--terracotta))]"
                onClick={() => handleSort('mainCategory')}
              >
                 <div className="flex items-center gap-1">
                  Category
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Margin %
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-[hsl(var(--terracotta))]"
                onClick={() => handleSort('totalScore')}
              >
                <div className="flex items-center justify-end gap-1">
                  Score
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Decision
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedProducts.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => handleSelectOne(product.id)}
                    className="rounded border-slate-600 bg-slate-700"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-white font-medium">{product.name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  <div className="font-medium text-white">{product.mainCategory || product.category}</div>
                  {product.subCategory && (
                    <div className="text-xs text-slate-500">{product.subCategory}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right text-white">${product.sellingPrice.toFixed(2)}</td>
                <td className={`px-4 py-3 text-sm text-right font-semibold ${product.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${product.netProfit.toFixed(2)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-semibold ${product.netMarginPct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {product.netMarginPct.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="inline-flex items-center justify-center w-12 h-6 rounded-full bg-[hsl(var(--terracotta))]/20 text-[hsl(var(--terracotta))] font-bold">
                    {product.totalScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getDecisionColor(product.decision)}`}>
                    {product.decision}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="text-[hsl(var(--terracotta))] hover:text-teal-300 hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate(product)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;