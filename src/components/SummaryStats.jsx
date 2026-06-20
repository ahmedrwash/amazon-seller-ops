import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Decision } from '@/types/product';

const SummaryStats = ({ products }) => {
  const totalProducts = products.length;
  const strongWinners = products.filter(p => p.decision === Decision.STRONG_WINNER).length;
  const testProducts = products.filter(p => p.decision === Decision.TEST_PRODUCT).length;
  const rejects = products.filter(p => p.decision === Decision.REJECT).length;
  const averageScore = totalProducts > 0 
    ? products.reduce((sum, p) => sum + p.totalScore, 0) / totalProducts 
    : 0;

  const stats = [
    {
      icon: Package,
      label: 'Total Products',
      value: totalProducts,
      color: 'text-[hsl(var(--terracotta))]',
      bgColor: 'bg-teal-400/10'
    },
    {
      icon: CheckCircle,
      label: 'Strong Winners',
      value: strongWinners,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      icon: AlertTriangle,
      label: 'Test Products',
      value: testProducts,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10'
    },
    {
      icon: XCircle,
      label: 'Rejects',
      value: rejects,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    },
    {
      icon: TrendingUp,
      label: 'Average Score',
      value: averageScore.toFixed(1),
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat.bgColor} rounded-lg p-4 border border-slate-700`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-xs text-slate-400">{stat.label}</span>
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default SummaryStats;