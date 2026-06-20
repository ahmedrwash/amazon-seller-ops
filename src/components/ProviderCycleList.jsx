import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Star } from 'lucide-react';

const ProviderCycleList = ({ providers }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50 overflow-hidden h-full overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 bg-slate-900 sticky top-0 z-10">
            <TableHead className="text-slate-300">Provider Name</TableHead>
            <TableHead className="text-slate-300">Type</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Rating</TableHead>
            <TableHead className="text-slate-300">Risk</TableHead>
            <TableHead className="text-right text-slate-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} className="border-slate-700 hover:bg-slate-800/50 cursor-pointer" onClick={() => navigate(`/provider-cycle/${provider.id}`)}>
              <TableCell className="font-medium text-slate-200">
                 {provider.provider_name}
              </TableCell>
              <TableCell className="text-slate-400">{provider.provider_type}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-slate-600 text-slate-300">{provider.status}</Badge>
              </TableCell>
              <TableCell>
                 <div className="flex items-center text-yellow-500">
                   {provider.internal_rating > 0 ? (
                      <><Star className="w-3 h-3 fill-current mr-1" /> {provider.internal_rating}</>
                   ) : '-'}
                 </div>
              </TableCell>
              <TableCell>
                 <span className={`text-xs px-2 py-1 rounded ${
                    provider.risk_level === 'High' ? 'bg-red-500/20 text-red-400' : 
                    provider.risk_level === 'Medium' ? 'bg-orange-500/20 text-orange-400' : 
                    'bg-green-500/20 text-green-400'
                 }`}>
                    {provider.risk_level || 'Unknown'}
                 </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-[hsl(var(--terracotta))] hover:text-teal-300">
                   View <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProviderCycleList;