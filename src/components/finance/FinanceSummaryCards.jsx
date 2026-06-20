import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Percent, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/financeUtils';

const SummaryCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <Card className="bg-slate-900 border-slate-800">
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white">{value}</div>
        {trend && (
           <span className={`text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'} flex items-center`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
           </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </CardContent>
  </Card>
);

const FinanceSummaryCards = ({ metrics }) => {
  const { revenue, netProfit, netMargin, costPerUnit } = metrics || {};
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard 
        title="Total Revenue" 
        value={formatCurrency(revenue || 0)} 
        icon={DollarSign}
        trend="up" // Placeholder logic
      />
      <SummaryCard 
        title="Net Profit" 
        value={formatCurrency(netProfit || 0)} 
        icon={TrendingUp}
        trend={(netProfit || 0) >= 0 ? 'up' : 'down'}
      />
      <SummaryCard 
        title="Net Margin" 
        value={formatPercentage((netMargin || 0) * 100)} // expects 0-1 or 0-100? utils says 0-100 returns
        icon={Percent}
      />
      <SummaryCard 
        title="Cost Per Unit" 
        value={formatCurrency(costPerUnit || 0)} 
        icon={ShoppingBag}
      />
    </div>
  );
};

export default FinanceSummaryCards;