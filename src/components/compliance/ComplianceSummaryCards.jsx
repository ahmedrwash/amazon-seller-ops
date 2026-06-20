import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, FileText, Ban } from 'lucide-react';
import { useComplianceStatus } from '@/hooks/useComplianceStatus';

const StatCard = ({ title, count, total, icon: Icon, color, delay }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`border-l-4 ${color.border} bg-slate-900 border-t-0 border-r-0 border-b-0`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-slate-100">{count}</h3>
              <p className="text-xs text-slate-500 mt-1">{percentage}% of total</p>
            </div>
            <div className={`p-2 rounded-full ${color.bg}`}>
              <Icon className={`w-5 h-5 ${color.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ComplianceSummaryCards = ({ complianceItems = [], readinessItems = [] }) => {
  // Combine items for overall stats if desired, or just show compliance
  // Assuming this is primarily for compliance items based on the prompt
  const { 
    totalCount, 
    missingCount, 
    inProgressCount, 
    completeCount, 
    overdueCount 
  } = useComplianceStatus(complianceItems);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <StatCard 
        title="Total Items" 
        count={totalCount} 
        total={totalCount} 
        icon={FileText} 
        color={{ border: 'border-l-slate-500', bg: 'bg-slate-800', text: 'text-slate-200' }}
        delay={0.1}
      />
      <StatCard 
        title="Missing" 
        count={missingCount} 
        total={totalCount} 
        icon={AlertCircle} 
        color={{ border: 'border-l-red-500', bg: 'bg-red-900/20', text: 'text-red-500' }}
        delay={0.2}
      />
      <StatCard 
        title="In Progress" 
        count={inProgressCount} 
        total={totalCount} 
        icon={Clock} 
        color={{ border: 'border-l-amber-500', bg: 'bg-amber-900/20', text: 'text-amber-500' }}
        delay={0.3}
      />
      <StatCard 
        title="Complete" 
        count={completeCount} 
        total={totalCount} 
        icon={CheckCircle} 
        color={{ border: 'border-l-emerald-500', bg: 'bg-emerald-900/20', text: 'text-emerald-500' }}
        delay={0.4}
      />
      <StatCard 
        title="Overdue" 
        count={overdueCount} 
        total={totalCount} 
        icon={Ban} 
        color={{ border: 'border-l-rose-600', bg: 'bg-rose-900/20', text: 'text-rose-500' }}
        delay={0.5}
      />
    </div>
  );
};

export default ComplianceSummaryCards;