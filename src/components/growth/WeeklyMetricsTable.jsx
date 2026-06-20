import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercentage } from '@/utils/growthUtils';
import { Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

const WeeklyMetricsTable = ({ data, onDelete }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-950">
          <TableRow>
            <TableHead>Week Start</TableHead>
            <TableHead>Spend</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>ACOS</TableHead>
            <TableHead>ROAS</TableHead>
            <TableHead>Units</TableHead>
            <TableHead>Impressions</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((row) => (
              <TableRow key={row.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell>{row.week_start_date}</TableCell>
                <TableCell>{formatCurrency(row.spend)}</TableCell>
                <TableCell>{formatCurrency(row.sales)}</TableCell>
                <TableCell className={row.acos > 30 ? 'text-red-400' : 'text-emerald-400'}>
                  {formatPercentage(row.acos)}
                </TableCell>
                <TableCell className={row.roas < 2 ? 'text-red-400' : 'text-emerald-400'}>
                  {Number(row.roas).toFixed(2)}
                </TableCell>
                <TableCell>{row.units_sold}</TableCell>
                <TableCell>{row.impressions}</TableCell>
                <TableCell>{row.clicks}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)} className="text-slate-500 hover:text-red-500 p-0 h-auto">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-slate-500">
                No weekly data recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default WeeklyMetricsTable;