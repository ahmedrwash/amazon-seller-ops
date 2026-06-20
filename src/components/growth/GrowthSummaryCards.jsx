import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/growthUtils';

const SummaryCard = ({ title, value, subtext, icon: Icon, trend, color = 'text-white' }) => (
  <Card className="bg-slate-900 border-slate-800">
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {Icon && <Icon className={`h-4 w-4 ${color}`} />}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white">{value}</div>
        {trend && (
           <span className={`text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500'} flex items-center`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
              {trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Flat'}
           </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </CardContent>
  </Card>
);

const GrowthSummaryCards = ({ metrics }) => {
  const { total_sales, total_spend, acos, roas, total_units, total_growth_percent } = metrics || {};
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <SummaryCard 
        title="Total Sales" 
        value={formatCurrency(total_sales)} 
        icon={DollarSign}
        color="text-emerald-500"
      />
      <SummaryCard 
        title="Total Spend" 
        value={formatCurrency(total_spend)} 
        icon={DollarSign}
        color="text-red-500"
      />
      <SummaryCard 
        title="ACOS" 
        value={`${Number(acos || 0).toFixed(2)}%`}
        icon={Target}
        color="text-amber-500"
      />
      <SummaryCard 
        title="ROAS" 
        value={Number(roas || 0).toFixed(2)}
        icon={Activity}
        color="text-emerald-500"
      />
      <SummaryCard 
        title="Units Sold" 
        value={total_units || 0}
        icon={TrendingUp}
        color="text-blue-500"
      />
      <SummaryCard 
        title="Growth" 
        value={formatPercentage(total_growth_percent || 0)}
        trend={(total_growth_percent || 0) > 0 ? 'up' : 'down'}
        icon={TrendingUp}
        color="text-emerald-500"
      />
    </div>
  );
};

export default GrowthSummaryCards;